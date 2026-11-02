"""Multi-session placement, mutation, conflict, revocation and zone-lock checks for disposable SCKRL-311 DB."""

from __future__ import annotations

import argparse
import os
import subprocess
import sys
import uuid

HOUSEHOLD = "31100000-0000-4000-8000-000000000010"
OWNER = "31100000-0000-4000-8000-000000000001"
MEMBER = "31100000-0000-4000-8000-000000000002"
RECEIPT_IDS = {
    "same_key": "31100000-0000-4000-8000-000000000100",
    "same_receipt_other_key": "31100000-0000-4000-8000-000000000101",
    "key_conflict_a": "31100000-0000-4000-8000-000000000102",
    "key_conflict_b": "31100000-0000-4000-8000-000000000103",
    "parse_freeze": "31100000-0000-4000-8000-000000000104",
    "membership_revoke": "31100000-0000-4000-8000-000000000105",
    "zone_delete": "31100000-0000-4000-8000-000000000106",
    "review_save": "31100000-0000-4000-8000-000000000107",
    "parse_promote": "31100000-0000-4000-8000-000000000108",
}


def psql_args(args: argparse.Namespace) -> list[str]:
    return [
        args.psql_bin,
        "-X",
        "-w",
        "-v",
        "ON_ERROR_STOP=1",
        "--host",
        args.host,
        "--port",
        str(args.port),
        "--username",
        args.user,
        "--dbname",
        args.database,
        "--no-align",
        "--tuples-only",
    ]


def app_env(application_name: str) -> dict[str, str]:
    environment = os.environ.copy()
    environment["PGAPPNAME"] = application_name
    return environment


def psql(args: argparse.Namespace, application_name: str, sql: str, timeout: float = 15) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        psql_args(args) + ["--command", sql],
        text=True,
        capture_output=True,
        check=True,
        timeout=timeout,
        env=app_env(application_name),
    )


def placement_sql(receipt_id: str, key: str, user_id: str, zone_key: str = "fridge",
                  post_sleep: int = 0, catch_error: bool = False,
                  assignment_zone_ids: list[str] | None = None,
                  lock_timeout_ms: int | None = None) -> str:
    after = f"perform pg_sleep({post_sleep});" if post_sleep else ""
    lock_timeout = f"set local lock_timeout = '{lock_timeout_ms}ms';" if lock_timeout_ms else ""
    if assignment_zone_ids is None:
        assignment_query = f"""
          select jsonb_agg(jsonb_build_object('receiptItemId',item->>'id','zoneId',z.id) order by item->>'id')
            into assignments
            from jsonb_array_elements(review->'items') item
            cross join lateral (select id from public.zones where household_id='{HOUSEHOLD}' and key='{zone_key}') z
            where (item->>'included')::boolean;
        """
    else:
        zone_ids = [str(uuid.UUID(zone_id)) for zone_id in assignment_zone_ids]
        case_values = " ".join(
            f"when {ordinal} then '{zone_id}'::uuid" for ordinal, zone_id in enumerate(zone_ids, start=1)
        )
        assignment_query = f"""
          select jsonb_agg(jsonb_build_object('receiptItemId',ordered.item->>'id',
            'zoneId',case ordered.ordinal {case_values} end) order by ordered.ordinal)
            into assignments
            from (
              select item,row_number() over(order by item->>'id') as ordinal
              from jsonb_array_elements(review->'items') item
              where (item->>'included')::boolean
            ) ordered;
        """
    run_call = f"""
      reply := public.finalize_receipt_placement('{HOUSEHOLD}','{receipt_id}',generation,revision,'{key}',assignments);
      raise notice 'SCKRL311_OUTCOME:%',reply->>'outcome';
    """
    if catch_error:
        run_call = f"""
          begin
            reply := public.finalize_receipt_placement('{HOUSEHOLD}','{receipt_id}',generation,revision,'{key}',assignments);
            raise notice 'SCKRL311_OUTCOME:%',reply->>'outcome';
          exception when others then
            get stacked diagnostics error_state=returned_sqlstate,error_detail=pg_exception_detail;
            raise notice 'SCKRL311_ERROR:%:%',error_state,coalesce(error_detail,'');
          end;
        """
    return f"""
      begin;
      set local role authenticated;
      {lock_timeout}
      select set_config('request.jwt.claim.sub','{user_id}',true);
      do $$
      declare review jsonb; generation uuid; revision integer; assignments jsonb; reply jsonb;
        error_state text; error_detail text;
      begin
        review:=public.get_receipt_review('{HOUSEHOLD}','{receipt_id}');
        generation:=(review #>> '{{receipt,active_parse_generation_id}}')::uuid;
        revision:=(review #>> '{{receipt,review_revision}}')::integer;
        {assignment_query}
        {run_call}
        {after}
      end $$;
      commit;
    """


def prepare_saved_review_sql(receipt_id: str) -> str:
    return f"""
      begin;
      set local role authenticated;
      select set_config('request.jwt.claim.sub','{OWNER}',true);
      do $$ declare review jsonb; begin
        review:=public.get_receipt_review('{HOUSEHOLD}','{receipt_id}');
        if (review #>> '{{receipt,review_revision}}')::integer <> 0 then
          raise exception 'Prepared mutation-race receipt must start unsaved.';
        end if;
        perform public.save_receipt_review('{HOUSEHOLD}','{receipt_id}',
          (review #>> '{{receipt,active_parse_generation_id}}')::uuid,0,
          jsonb_build_array(jsonb_build_object(
            'id',review #>> '{{items,0,id}}','included',true,'review_state','reviewed',
            'name','Fixture Item','qty_value',1,'qty_unit','pcs','category_id','pantry',
            'expiry',jsonb_build_object('state','unknown','date',null)
          )));
      end $$;
      commit;
    """


def prepare_zone_order_fixture(args: argparse.Namespace) -> tuple[str, str, str, str]:
    receipt_ids = (str(uuid.uuid4()), str(uuid.uuid4()))
    zone_ids = tuple(str(uuid.uuid4()) for _ in range(2))
    zone_values = ",".join(
        f"('{zone_id}','{HOUSEHOLD}','s311synthetic-{zone_id.replace('-', '')[:18]}',"
        f"'S311 zone order {index}',{899 + index})"
        for index, zone_id in enumerate(zone_ids, start=1)
    )
    values = ",".join(
        f"('{receipt_id}','{HOUSEHOLD}','sackerl://receipt/sckrl-311-zone-order-{index}',"
        "'uploaded','2026-10-03T10:00:00Z','EUR')"
        for index, receipt_id in enumerate(receipt_ids, start=1)
    )
    receipt_array = ",".join(f"'{receipt_id}'::uuid" for receipt_id in receipt_ids)
    sql = f"""
      begin;
      insert into public.zones (id,household_id,key,label,sort_order) values {zone_values};
      insert into public.receipts (id,household_id,image_url,status,captured_at,currency)
      values {values};
      set local role authenticated;
      select set_config('request.jwt.claim.sub','{OWNER}',true);
      do $$
      declare receipt_id uuid; review jsonb; generation uuid;
      begin
        foreach receipt_id in array array[{receipt_array}] loop
          review:=public.promote_receipt_parse(
            '{HOUSEHOLD}',receipt_id,null,0,'fixture-parser-v1','fixture-provider','EUR',
            '2026-10-03','S311 zone-order fixture',299,
            jsonb_build_array(
              jsonb_build_object('raw_text','ZONE ORDER A 1PCS 1.00','inferred_name','Zone Order A',
                'qty_value',1,'qty_unit','pcs','category_id','pantry','confidence',0.9,'confidence_level','high'),
              jsonb_build_object('raw_text','ZONE ORDER B 1PCS 2.00','inferred_name','Zone Order B',
                'qty_value',1,'qty_unit','pcs','category_id','pantry','confidence',0.9,'confidence_level','high')
            )
          );
          generation:=(review #>> '{{receipt,active_parse_generation_id}}')::uuid;
          perform public.save_receipt_review(
            '{HOUSEHOLD}',receipt_id,generation,0,
            jsonb_build_array(
              jsonb_build_object('id',review #>> '{{items,0,id}}','included',true,'review_state','reviewed',
                'name','Zone Order A','qty_value',1,'qty_unit','pcs','category_id','pantry',
                'expiry',jsonb_build_object('state','unknown','date',null)),
              jsonb_build_object('id',review #>> '{{items,1,id}}','included',true,'review_state','reviewed',
                'name','Zone Order B','qty_value',1,'qty_unit','pcs','category_id','pantry',
                'expiry',jsonb_build_object('state','unknown','date',null))
            )
          );
        end loop;
      end $$;
      commit;
    """
    psql(args, f"s311zoneprep_{uuid.uuid4().hex[:10]}", sql)
    low_zone_id, high_zone_id = sorted(zone_ids)
    return (*receipt_ids, low_zone_id, high_zone_id)


def mutation_sql(receipt_id: str, operation: str) -> str:
    if operation == "review_save":
        command = f"""
          perform public.save_receipt_review('{HOUSEHOLD}','{receipt_id}',
            (review #>> '{{receipt,active_parse_generation_id}}')::uuid,
            (review #>> '{{receipt,review_revision}}')::integer,
            jsonb_build_array(jsonb_build_object(
              'id',review #>> '{{items,0,id}}','included',true,'review_state','reviewed',
              'name','Contended Rewrite','qty_value',99,'qty_unit','kg','category_id','produce',
              'expiry',jsonb_build_object('state','unknown','date',null)
            )));
        """
    elif operation == "parse_promote":
        command = f"""
          perform public.promote_receipt_parse('{HOUSEHOLD}','{receipt_id}',
            (review #>> '{{receipt,active_parse_generation_id}}')::uuid,
            (review #>> '{{receipt,review_revision}}')::integer,
            'contended-parser-v2','fixture-provider','EUR','2026-10-04','Contended promotion',299,
            jsonb_build_array(jsonb_build_object(
              'raw_text','CONTENDED ITEM 2KG','inferred_name','Contended Item','qty_value',2,
              'qty_unit','kg','category_id','produce','confidence',0.9,'confidence_level','high'
            )));
        """
    else:
        raise ValueError(f"Unsupported placement mutation race: {operation}")
    return f"""
      begin;
      set local role authenticated;
      select set_config('request.jwt.claim.sub','{OWNER}',true);
      do $$ declare review jsonb; error_state text; error_detail text; error_message text; begin
        review:=public.get_receipt_review('{HOUSEHOLD}','{receipt_id}');
        begin
          {command}
          raise exception 'SCKRL311_TEST_MUTATION_UNEXPECTED_SUCCESS';
        exception when others then
          get stacked diagnostics error_state=returned_sqlstate,error_detail=pg_exception_detail,error_message=message_text;
          raise notice 'SCKRL311_ERROR:%:%:%',error_state,coalesce(error_detail,''),error_message;
        end;
      end $$;
      commit;
    """


def run_mutation_race(args: argparse.Namespace, receipt_id: str, operation: str) -> str:
    holder = f"s311hold_{uuid.uuid4().hex[:12]}"
    waiter = f"s311wait_{uuid.uuid4().hex[:12]}"
    processes: list[subprocess.Popen[str]] = []
    try:
        holder_process = start(args, holder, placement_sql(receipt_id, str(uuid.uuid4()), OWNER, post_sleep=5))
        processes.append(holder_process)
        wait_for_sleep(args, holder, args.blocking_timeout)
        mutation_process = start(args, waiter, mutation_sql(receipt_id, operation))
        processes.append(mutation_process)
        wait_for_block(args, holder, waiter, args.blocking_timeout)
        holder_out, holder_err = collect(holder_process, f"{operation} race placement", args.blocking_timeout + 10)
        mutation_out, mutation_err = collect(mutation_process, f"{operation} contender", args.blocking_timeout + 5)
        assert_marker(holder_out + holder_err, "SCKRL311_OUTCOME:placed", f"{operation} race placement")
        assert_marker(mutation_out + mutation_err, "SCKRL311_ERROR:PT409:", f"{operation} placed conflict")
        assert_marker(mutation_out + mutation_err, "RECEIPT_ALREADY_PLACED", f"{operation} stable placed error")
        return mutation_out + mutation_err
    finally:
        cleanup(processes)


def assert_mutation_source_unchanged(args: argparse.Namespace, receipt_id: str, operation: str) -> None:
    if operation == "review_save":
        condition = f"""
          (select review_revision=1 from public.receipts where id='{receipt_id}')
          and (select count(*)=1 and bool_and(included and inferred_name='Fixture Item'
            and corrected_name is distinct from 'Contended Rewrite'
            and corrected_qty_value is distinct from 99)
            from public.receipt_items where receipt_id='{receipt_id}')
        """
    elif operation == "parse_promote":
        condition = f"""
          (select review_revision=1 from public.receipts where id='{receipt_id}')
          and (select count(*)=1 from public.receipt_parse_generations where receipt_id='{receipt_id}')
          and (select count(*)=1 and bool_and(inferred_name='Fixture Item' and raw_text='FIXTURE 1PCS 1.99')
            from public.receipt_items where receipt_id='{receipt_id}')
        """
    else:
        raise ValueError(f"Unsupported placement mutation assertion: {operation}")
    sql = f"""
      do $$ begin
        if not ({condition}) then raise exception '{operation} race changed its original saved source.'; end if;
      end $$;
    """
    psql(args, f"s311verify_{uuid.uuid4().hex[:10]}", sql)


def wait_for_sleep(args: argparse.Namespace, application_name: str, timeout: float) -> None:
    sql = f"""
      do $$ declare found_query boolean; begin
        for attempt in 1..{int(timeout * 20)} loop
          perform pg_stat_clear_snapshot();
          select exists(select 1 from pg_stat_activity
            where application_name='{application_name}' and state='active'
              and wait_event='PgSleep') into found_query;
          if found_query then return; end if;
          perform pg_sleep(0.05);
        end loop;
        raise exception 'Timed out waiting for session {application_name} to reach its post-placement sleep.';
      end $$;
    """
    psql(args, f"s311mon_{uuid.uuid4().hex[:12]}", sql, timeout=timeout + 5)


def wait_for_block(args: argparse.Namespace, holder: str, waiter: str, timeout: float) -> None:
    sql = f"""
      do $$ declare found_block boolean; begin
        for attempt in 1..{int(timeout * 20)} loop
          perform pg_stat_clear_snapshot();
          select exists(
            select 1 from pg_stat_activity waiting
            join pg_stat_activity holding on holding.application_name='{holder}'
            where waiting.application_name='{waiter}'
              and holding.pid = any(pg_blocking_pids(waiting.pid))
          ) into found_block;
          if found_block then return; end if;
          perform pg_sleep(0.05);
        end loop;
        raise exception 'Session {waiter} was not observed blocked by {holder}.';
      end $$;
    """
    psql(args, f"s311mon_{uuid.uuid4().hex[:12]}", sql, timeout=timeout + 5)


def wait_for_blockers(args: argparse.Namespace, waiter: str, expected_holders: list[str], timeout: float,
                      expected_holder_pids: dict[str, int] | None = None) -> str:
    expected = sorted(expected_holders)
    expected_sql = "array[" + ",".join(f"'{name}'" for name in expected) + "]::text[]"
    if expected_holder_pids is None:
        blocker_predicate = (
            f"blocker_apps={expected_sql} "
            f"and cardinality(blocker_pids)=cardinality({expected_sql})"
        )
        expected_description = f"exact application set {','.join(expected)}"
    else:
        if sorted(expected_holder_pids) != expected:
            raise ValueError("Expected blocker PID map must name exactly the expected holder applications.")
        expected_pairs = sorted(f"{application}={pid}" for application, pid in expected_holder_pids.items())
        expected_pairs_sql = "array[" + ",".join(f"'{pair}'" for pair in expected_pairs) + "]::text[]"
        blocker_predicate = (
            f"cardinality(blocker_pairs)>0 and blocker_pairs <@ {expected_pairs_sql} "
            "and cardinality(blocker_pairs)=cardinality(blocker_pids)"
        )
        expected_description = f"nonempty exact application/PID subset of {','.join(expected_pairs)}"
    sql = f"""
      do $$ declare waiter_count integer; waiter_pid integer; blocker_apps text[];
        blocker_pids integer[]; blocker_pairs text[];
      begin
        for attempt in 1..{int(timeout * 20)} loop
          perform pg_stat_clear_snapshot();
          select count(distinct waiting.pid),min(waiting.pid),
            array_agg(distinct holding.application_name order by holding.application_name),
            array_agg(distinct holding.pid order by holding.pid),
            array_agg(distinct holding.application_name || '=' || holding.pid::text
              order by holding.application_name || '=' || holding.pid::text)
          into waiter_count,waiter_pid,blocker_apps,blocker_pids,blocker_pairs
          from pg_stat_activity waiting
          cross join lateral unnest(pg_blocking_pids(waiting.pid)) blocker(pid)
          join pg_stat_activity holding on holding.pid=blocker.pid
          where waiting.application_name='{waiter}';
          if waiter_count=1 and {blocker_predicate} then
            raise notice 'SCKRL311_BLOCKERS:{waiter}:%:%',waiter_pid,
              (select string_agg(holding.application_name || '=' || holding.pid::text, ','
                order by holding.application_name)
               from pg_stat_activity holding where holding.pid=any(blocker_pids));
            return;
          end if;
          perform pg_sleep(0.05);
        end loop;
        raise exception 'Session {waiter} did not satisfy blocker expectation ({expected_description}); last waiter_count=%, waiter_pid=%, blockers=%',
          waiter_count,waiter_pid,coalesce(array_to_string(blocker_pairs,','),'none');
      end $$;
    """
    try:
        result = psql(args, f"s311mon_{uuid.uuid4().hex[:12]}", sql, timeout=timeout + 5)
    except subprocess.CalledProcessError as error:
        diagnostics = "\n".join(
            part.strip() for part in (error.stderr, error.stdout) if part and part.strip()
        )
        raise RuntimeError(
            f"Blocker observer for {waiter} failed; expected {expected_description}. "
            f"PostgreSQL diagnostics: {diagnostics or 'none'}"
        ) from error
    output = result.stderr + result.stdout
    assert_marker(output, f"SCKRL311_BLOCKERS:{waiter}:", f"exact blocker set for {waiter}")
    return output


def observed_waiter_pid(output: str, application_name: str) -> int:
    marker = f"SCKRL311_BLOCKERS:{application_name}:"
    for line in output.splitlines():
        if marker in line:
            value = line.split(marker, 1)[1].split(":", 1)[0]
            try:
                return int(value)
            except ValueError as error:
                raise RuntimeError(f"Blocker notice for {application_name} had an invalid waiter PID: {line}") from error
    raise RuntimeError(f"Blocker notice for {application_name} is missing from observer output: {output}")


def cleanup(processes: list[subprocess.Popen[str]]) -> None:
    for process in processes:
        if process.poll() is None:
            process.terminate()
    for process in processes:
        if process.poll() is None:
            try:
                process.communicate(timeout=2)
            except subprocess.TimeoutExpired:
                process.kill()
                process.communicate(timeout=2)


def collect(process: subprocess.Popen[str], label: str, timeout: float) -> tuple[str, str]:
    try:
        stdout, stderr = process.communicate(timeout=timeout)
    except subprocess.TimeoutExpired:
        process.terminate()
        try:
            stdout, stderr = process.communicate(timeout=2)
        except subprocess.TimeoutExpired:
            process.kill()
            stdout, stderr = process.communicate(timeout=2)
        raise RuntimeError(f"{label} psql process timed out. {stderr}{stdout}")
    if process.returncode != 0:
        raise RuntimeError(f"{label} psql process failed: {stderr}{stdout}")
    return stdout, stderr


def start(args: argparse.Namespace, application_name: str, sql: str) -> subprocess.Popen[str]:
    return subprocess.Popen(
        psql_args(args) + ["--command", sql],
        text=True,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        env=app_env(application_name),
    )


def assert_marker(output: str, marker: str, description: str) -> None:
    if marker not in output:
        raise RuntimeError(f"Expected {description}; output was: {output}")


def run_race(args: argparse.Namespace, receipt_id: str, first_key: str, second_key: str,
             first_user: str = OWNER, second_user: str = OWNER, first_zone: str = "fridge",
             second_zone: str = "fridge", second_catches_error: bool = False,
             post_sleep: int = 4,
             second_receipt_id: str | None = None) -> tuple[str, str]:
    holder = f"s311hold_{uuid.uuid4().hex[:12]}"
    waiter = f"s311wait_{uuid.uuid4().hex[:12]}"
    processes: list[subprocess.Popen[str]] = []
    try:
        first = start(args, holder, placement_sql(receipt_id, first_key, first_user, first_zone,
                                                   post_sleep))
        processes.append(first)
        wait_for_sleep(args, holder, args.blocking_timeout)
        second = start(args, waiter, placement_sql(second_receipt_id or receipt_id, second_key, second_user, second_zone,
                                                    catch_error=second_catches_error))
        processes.append(second)
        wait_for_block(args, holder, waiter, args.blocking_timeout)
        first_out, first_err = collect(first, "holder", args.blocking_timeout + post_sleep + 5)
        second_out, second_err = collect(second, "waiter", args.blocking_timeout + 5)
        return first_out + first_err, second_out + second_err
    finally:
        cleanup(processes)


def assert_unplaced(args: argparse.Namespace, receipt_id: str) -> None:
    sql = f"""
      do $$ begin
        if exists(select 1 from public.receipt_placements where receipt_id='{receipt_id}')
          or exists(select 1 from public.inventory_acquisition_events where receipt_id='{receipt_id}')
          or exists(select 1 from public.items where source_receipt_item_id in
            (select id from public.receipt_items where receipt_id='{receipt_id}')) then
          raise exception 'Failed/conflicting placement left provisional rows for {receipt_id}.';
        end if;
      end $$;
    """
    psql(args, f"s311verify_{uuid.uuid4().hex[:10]}", sql)


def assert_zone_order_result(args: argparse.Namespace, receipt_id: str, key: str,
                             assignment_zone_ids: list[str], low_zone_id: str,
                             high_zone_id: str) -> None:
    zone_ids = [str(uuid.UUID(zone_id)) for zone_id in assignment_zone_ids]
    case_values = " ".join(
        f"when {ordinal} then '{zone_id}'::uuid" for ordinal, zone_id in enumerate(zone_ids, start=1)
    )
    sql = f"""
      begin; set local role authenticated;
      select set_config('request.jwt.claim.sub','{OWNER}',true);
      do $$ declare result jsonb; status jsonb; actual jsonb; expected jsonb; begin
        select p.result into strict result from public.receipt_placements p
          where p.receipt_id='{receipt_id}' and p.household_id='{HOUSEHOLD}';
        if result->>'receiptId'<>'{receipt_id}' or result->>'idempotencyKey'<>'{key}'
          or jsonb_array_length(result->'items')<>2 then
          raise exception 'Zone-order placement did not persist its exact canonical result.';
        end if;
        status:=public.get_receipt_placement('{HOUSEHOLD}','{receipt_id}','{key}');
        if status->>'state'<>'placed' or status->>'keyMatches'<>'true'
          or status->'placement' is distinct from result then
          raise exception 'Zone-order placement status did not return its canonical committed result.';
        end if;
        select jsonb_agg(jsonb_build_object('receiptItemId',item->>'receiptItemId','zoneId',item->>'zoneId')
          order by item->>'receiptItemId') into actual
          from jsonb_array_elements(result->'items') item;
        select jsonb_agg(jsonb_build_object('receiptItemId',line.id::text,
          'zoneId',case line.ordinal {case_values} end) order by line.id) into expected
          from (select ri.id,row_number() over(order by ri.id) ordinal
            from public.receipt_items ri where ri.receipt_id='{receipt_id}' and ri.included) line;
        if expected is null or expected is distinct from actual then
          raise exception 'Zone-order result changed the submitted line-to-zone mapping.';
        end if;
        if (select count(*)<>2 from public.items i join public.receipt_items ri
            on ri.id=i.source_receipt_item_id where ri.receipt_id='{receipt_id}' and ri.included)
          or (select count(*)<>2 from public.inventory_acquisition_events e where e.receipt_id='{receipt_id}')
          or (select count(*)<>1 from public.receipt_placements p where p.receipt_id='{receipt_id}')
          or not exists(select 1 from public.zones where id='{low_zone_id}' and household_id='{HOUSEHOLD}')
          or not exists(select 1 from public.zones where id='{high_zone_id}' and household_id='{HOUSEHOLD}')
          or (select count(*)<>2 from jsonb_array_elements(result->'items') placed(item)
            join public.items i on i.id=(placed.item->>'itemId')::uuid
              and i.source_receipt_item_id=(placed.item->>'receiptItemId')::uuid
              and i.zone_id=(placed.item->>'zoneId')::uuid)
          or (select count(*)<>2 from jsonb_array_elements(result->'items') placed(item)
            join public.inventory_acquisition_events e on e.id=(placed.item->>'acquisitionEventId')::uuid
              and e.item_id=(placed.item->>'itemId')::uuid
              and e.source_receipt_item_id=(placed.item->>'receiptItemId')::uuid
              and e.zone_id=(placed.item->>'zoneId')::uuid)
          or (select count(*)<>2 or not bool_and(e.zone_id=i.zone_id)
            from public.inventory_acquisition_events e join public.items i on i.id=e.item_id
            where e.receipt_id='{receipt_id}') then
          raise exception 'Zone-order stock, event, placement counts or retained zones are inconsistent.';
        end if;
      end $$;
      commit;
    """
    psql(args, f"s311verify_{uuid.uuid4().hex[:10]}", sql)


def zone_delete_probe_sql(zone_id: str) -> str:
    return f"""
      begin; set local role authenticated;
      select set_config('request.jwt.claim.sub','{OWNER}',true);
      set local lock_timeout = '2000ms';
      do $$ declare error_state text; error_message text; begin
        begin
          delete from public.zones where household_id='{HOUSEHOLD}' and id='{zone_id}';
          raise exception 'SCKRL311_TEST_ZONE_DELETE_PROBE_UNEXPECTED_SUCCESS';
        exception when sqlstate '55P03' then
          get stacked diagnostics error_state=returned_sqlstate,error_message=message_text;
          if error_state<>'55P03' then raise; end if;
          raise notice 'SCKRL311_ZONE_DELETE_PROBE:%:%',error_state,error_message;
        end;
      end $$;
      rollback;
    """


def zone_delete_sql(zone_id: str) -> str:
    return f"""
      begin; set local role authenticated;
      select set_config('request.jwt.claim.sub','{OWNER}',true);
      set local lock_timeout = '30s';
      do $$ declare error_state text; error_detail text; error_message text; begin
        begin
          delete from public.zones where household_id='{HOUSEHOLD}' and id='{zone_id}';
          raise exception 'SCKRL311_TEST_ZONE_DELETE_UNEXPECTED_SUCCESS';
        exception when others then
          get stacked diagnostics error_state=returned_sqlstate,error_detail=pg_exception_detail,
            error_message=message_text;
          raise notice 'SCKRL311_ZONE_DELETE_ERROR:%:%:%',error_state,
            coalesce(error_detail,''),coalesce(error_message,'');
        end;
      end $$;
      commit;
    """


def run_zone_lock_order_case(args: argparse.Namespace) -> None:
    receipt_a, receipt_b, low_zone_id, high_zone_id = prepare_zone_order_fixture(args)
    key_a, key_b = str(uuid.uuid4()), str(uuid.uuid4())
    gate = f"s311gate_{uuid.uuid4().hex[:12]}"
    placer_a = f"s311ordera_{uuid.uuid4().hex[:10]}"
    placer_b = f"s311orderb_{uuid.uuid4().hex[:10]}"
    deleter = f"s311zdel_{uuid.uuid4().hex[:12]}"
    hold_seconds = 20
    processes: list[subprocess.Popen[str]] = []
    try:
        gate_process = start(args, gate, f"""
          begin;
          select id from public.zones where household_id='{HOUSEHOLD}' and id='{high_zone_id}' for update;
          select pg_sleep({hold_seconds});
          commit;
        """)
        processes.append(gate_process)
        wait_for_sleep(args, gate, args.blocking_timeout)

        placement_a = start(args, placer_a, placement_sql(
            receipt_a, key_a, OWNER, assignment_zone_ids=[high_zone_id, low_zone_id],
            lock_timeout_ms=30000))
        processes.append(placement_a)
        gate_a = wait_for_blockers(args, placer_a, [gate], args.blocking_timeout)
        print(gate_a, end="")
        placement_a_pid = observed_waiter_pid(gate_a, placer_a)

        probe_name = f"s311zprobe_{uuid.uuid4().hex[:10]}"
        probe_process = start(args, probe_name, zone_delete_probe_sql(low_zone_id))
        processes.append(probe_process)
        probe_blockers = wait_for_blockers(args, probe_name, [placer_a], args.blocking_timeout)
        print(probe_blockers, end="")
        probe_out, probe_err = collect(probe_process, "low-zone delete lock-timeout probe",
                                       args.blocking_timeout + 5)
        assert_marker(probe_out + probe_err, "SCKRL311_ZONE_DELETE_PROBE:55P03:",
                      "low-zone delete probe timing out only after observing placement A as its blocker")

        placement_b = start(args, placer_b, placement_sql(
            receipt_b, key_b, OWNER, assignment_zone_ids=[low_zone_id, high_zone_id],
            lock_timeout_ms=30000))
        processes.append(placement_b)
        gate_b = wait_for_blockers(args, placer_b, [gate], args.blocking_timeout)
        print(gate_b, end="")
        placement_b_pid = observed_waiter_pid(gate_b, placer_b)

        delete_process = start(args, deleter, zone_delete_sql(low_zone_id))
        processes.append(delete_process)
        delete_blockers = wait_for_blockers(
            args, deleter, [placer_a, placer_b], args.blocking_timeout,
            expected_holder_pids={placer_a: placement_a_pid, placer_b: placement_b_pid})
        print(delete_blockers, end="")

        gate_out, gate_err = collect(gate_process, "zone-order high-zone gate",
                                     args.blocking_timeout + hold_seconds + 5)
        a_out, a_err = collect(placement_a, "high-first multi-zone placement",
                               args.blocking_timeout + 5)
        b_out, b_err = collect(placement_b, "low-first multi-zone placement",
                               args.blocking_timeout + 5)
        delete_out, delete_err = collect(delete_process, "low-zone deletion after placement lock",
                                         args.blocking_timeout + 5)
        assert_marker(a_out + a_err, "SCKRL311_OUTCOME:placed", "high-first placement success")
        assert_marker(b_out + b_err, "SCKRL311_OUTCOME:placed", "low-first placement success")
        assert_marker(delete_out + delete_err, "SCKRL311_ZONE_DELETE_ERROR:23503:",
                      "zone deletion waiting for placement and then hitting its stock foreign key")
        if "SCKRL311_ZONE_DELETE_ERROR:P0001:" in delete_out + delete_err:
            raise RuntimeError("The low-zone delete unexpectedly succeeded and was rolled back by the fixture.")
        del gate_out, gate_err
    finally:
        cleanup(processes)

    assert_zone_order_result(args, receipt_a, key_a, [high_zone_id, low_zone_id], low_zone_id, high_zone_id)
    assert_zone_order_result(args, receipt_b, key_b, [low_zone_id, high_zone_id], low_zone_id, high_zone_id)


def run(args: argparse.Namespace) -> None:
    preflight = psql(args, f"s311pre_{uuid.uuid4().hex[:10]}",
        f"select count(*) from public.receipt_placements where receipt_id in ({','.join(repr(x) for x in RECEIPT_IDS.values())})")
    counts = [int(line.strip()) for line in preflight.stdout.splitlines() if line.strip().isdigit()]
    if not counts or counts[-1] != 0:
        raise RuntimeError("The prepared receipts are already placed; use a fresh populated disposable replay.")
    mutation_seed = psql(args, f"s311pre_{uuid.uuid4().hex[:10]}", f"""
      select count(*) from public.receipts
      where id in ('{RECEIPT_IDS['review_save']}','{RECEIPT_IDS['parse_promote']}')
        and review_revision=0 and active_parse_generation_id is not null
    """)
    mutation_counts = [int(line.strip()) for line in mutation_seed.stdout.splitlines() if line.strip().isdigit()]
    if not mutation_counts or mutation_counts[-1] != 2:
        raise RuntimeError("Review-save and parse-promotion race receipts must be fresh unsaved parser snapshots.")
    for operation in ("review_save", "parse_promote"):
        psql(args, f"s311prep_{uuid.uuid4().hex[:10]}", prepare_saved_review_sql(RECEIPT_IDS[operation]))

    run_zone_lock_order_case(args)

    same_key = str(uuid.uuid4())
    first, second = run_race(args, RECEIPT_IDS["same_key"], same_key, same_key)
    combined = first + second
    assert_marker(combined, "SCKRL311_OUTCOME:placed", "one initial placement")
    assert_marker(combined, "SCKRL311_OUTCOME:replayed", "one canonical same-key replay")
    verify_same = psql(args, f"s311verify_{uuid.uuid4().hex[:10]}", f"""
      do $$ declare expected bigint; begin
        select count(*) into expected from public.receipt_items where receipt_id='{RECEIPT_IDS['same_key']}' and included;
        if expected=0
          or (select count(*) from public.items where source_receipt_item_id in
            (select id from public.receipt_items where receipt_id='{RECEIPT_IDS['same_key']}' and included)) <> expected
          or (select count(*) from public.inventory_acquisition_events where receipt_id='{RECEIPT_IDS['same_key']}') <> expected
          or (select count(*) from public.receipt_placements where receipt_id='{RECEIPT_IDS['same_key']}') <> 1 then
          raise exception 'Same-key race produced duplicate or missing included-line stock/events.';
        end if;
      end $$;
    """)
    del verify_same

    # A competing key for the same placed receipt returns the original canonical result.
    diff_first, diff_second = run_race(args, RECEIPT_IDS["same_receipt_other_key"],
        str(uuid.uuid4()), str(uuid.uuid4()))
    assert_marker(diff_first + diff_second, "SCKRL311_OUTCOME:placed", "one initial alternate-key placement")
    assert_marker(diff_first + diff_second, "SCKRL311_OUTCOME:already_placed", "one canonical alternate-key response")

    # Different receipts racing for one household key: the loser reaches the unique index,
    # waits on the uncommitted winner, returns PLACEMENT_KEY_REUSED and leaves no provisional rows.
    shared_key = str(uuid.uuid4())
    key_first, key_second = run_race(args, RECEIPT_IDS["key_conflict_a"], shared_key, shared_key,
        post_sleep=5, second_receipt_id=RECEIPT_IDS["key_conflict_b"],
        second_catches_error=True)
    assert_marker(key_first + key_second, "SCKRL311_OUTCOME:placed", "the winning shared-key placement")
    assert_marker(key_second, "SCKRL311_ERROR:PT409:", "shared-key conflict")
    assert_marker(key_second, "PLACEMENT_KEY_REUSED", "stable shared-key error code")
    assert_unplaced(args, RECEIPT_IDS["key_conflict_b"])

    # Parse-failure waits behind placement and then receives the placed conflict.
    parse_key = str(uuid.uuid4())
    parse_holder = f"s311hold_{uuid.uuid4().hex[:12]}"
    parse_waiter = f"s311wait_{uuid.uuid4().hex[:12]}"
    processes = []
    try:
        holder_sql = placement_sql(RECEIPT_IDS["parse_freeze"], parse_key, OWNER, post_sleep=5)
        holder_process = start(args, parse_holder, holder_sql)
        processes.append(holder_process)
        wait_for_sleep(args, parse_holder, args.blocking_timeout)
        mutation_sql = f"""
          begin; set local role authenticated;
          select set_config('request.jwt.claim.sub','{OWNER}',true);
          do $$ declare review jsonb; err_state text; err_detail text; begin
            review:=public.get_receipt_review('{HOUSEHOLD}','{RECEIPT_IDS['parse_freeze']}');
            begin
              perform public.mark_receipt_parse_failed('{HOUSEHOLD}','{RECEIPT_IDS['parse_freeze']}',
                (review #>> '{{receipt,active_parse_generation_id}}')::uuid,
                (review #>> '{{receipt,review_revision}}')::integer);
            exception when others then
              get stacked diagnostics err_state=returned_sqlstate,err_detail=pg_exception_detail;
              raise notice 'SCKRL311_ERROR:%:%',err_state,coalesce(err_detail,'');
            end;
          end $$; commit;
        """
        mutation_process = start(args, parse_waiter, mutation_sql)
        processes.append(mutation_process)
        wait_for_block(args, parse_holder, parse_waiter, args.blocking_timeout)
        holder_out, holder_err = collect(holder_process, "parse-race holder", args.blocking_timeout + 10)
        mutation_out, mutation_err = collect(mutation_process, "parse-failure contender", args.blocking_timeout + 5)
        assert_marker(holder_out + holder_err, "SCKRL311_OUTCOME:placed", "parse-race placement")
        assert_marker(mutation_out + mutation_err, "SCKRL311_ERROR:PT409:", "placed parse-failure rejection")
        assert_marker(mutation_out + mutation_err, "RECEIPT_ALREADY_PLACED", "stable placed parse-failure code")
    finally:
        cleanup(processes)

    # Review-save and parse-promotion callers must block on placement, then preserve the original saved source.
    for operation in ("review_save", "parse_promote"):
        run_mutation_race(args, RECEIPT_IDS[operation], operation)
        assert_mutation_source_unchanged(args, RECEIPT_IDS[operation], operation)

    # Membership deletion waits on the exact member-row key-share lock held by placement.
    member_key = str(uuid.uuid4())
    member_holder = f"s311hold_{uuid.uuid4().hex[:12]}"
    member_waiter = f"s311wait_{uuid.uuid4().hex[:12]}"
    processes = []
    try:
        holder_process = start(args, member_holder, placement_sql(RECEIPT_IDS["membership_revoke"], member_key,
            MEMBER, post_sleep=5))
        processes.append(holder_process)
        wait_for_sleep(args, member_holder, args.blocking_timeout)
        revoke_process = start(args, member_waiter, f"delete from public.household_members where household_id='{HOUSEHOLD}' and user_id='{MEMBER}';")
        processes.append(revoke_process)
        wait_for_block(args, member_holder, member_waiter, args.blocking_timeout)
        holder_out, holder_err = collect(holder_process, "membership-lock holder", args.blocking_timeout + 10)
        revoke_out, revoke_err = collect(revoke_process, "membership revocation", args.blocking_timeout + 5)
        assert_marker(holder_out + holder_err, "SCKRL311_OUTCOME:placed", "membership-lock placement")
        if revoke_process.returncode != 0:
            raise RuntimeError(f"Membership revocation failed after placement committed: {revoke_err}{revoke_out}")
    finally:
        cleanup(processes)
    revoked = psql(args, f"s311verify_{uuid.uuid4().hex[:10]}", f"""
      begin; set local role authenticated;
      select set_config('request.jwt.claim.sub','{MEMBER}',true);
      do $$ declare state text; detail text; found_error boolean := false; begin
        begin perform public.get_receipt_placement('{HOUSEHOLD}','{RECEIPT_IDS['membership_revoke']}');
        exception when others then get stacked diagnostics state=returned_sqlstate,detail=pg_exception_detail;
          if state<>'PT403' or detail not like '%HOUSEHOLD_ACCESS_REQUIRED%' then raise; end if;
          found_error:=true;
        end;
        if not found_error then raise exception 'Revoked member unexpectedly read the placement result.'; end if;
      end $$; rollback;
    """)
    del revoked

    # Let a zone delete win before placement locks it; placement must wake with the stable 422, no raw FK.
    zone_row = psql(args, f"s311zone_{uuid.uuid4().hex[:10]}",
        f"select id from public.zones where household_id='{HOUSEHOLD}' and key='basement'")
    zone_id = next((line.strip() for line in zone_row.stdout.splitlines() if line.strip()), None)
    if not zone_id:
        raise RuntimeError("Seeded basement zone is missing for the deletion race.")
    deleter = f"s311hold_{uuid.uuid4().hex[:12]}"
    placer = f"s311wait_{uuid.uuid4().hex[:12]}"
    processes = []
    try:
        delete_process = start(args, deleter, f"begin; delete from public.zones where id='{zone_id}'; select pg_sleep(5); commit;")
        processes.append(delete_process)
        wait_for_sleep(args, deleter, args.blocking_timeout)
        zone_process = start(args, placer, placement_sql(RECEIPT_IDS["zone_delete"], str(uuid.uuid4()), OWNER,
                                                           zone_key="basement", catch_error=True))
        processes.append(zone_process)
        wait_for_block(args, deleter, placer, args.blocking_timeout)
        delete_out, delete_err = collect(delete_process, "zone-delete holder", args.blocking_timeout + 10)
        place_out, place_err = collect(zone_process, "zone placement contender", args.blocking_timeout + 5)
        if delete_process.returncode != 0:
            raise RuntimeError(f"Unused-zone deletion did not commit: {delete_err}{delete_out}")
        assert_marker(place_out + place_err, "SCKRL311_ERROR:PT422:", "invalid-zone result after delete race")
        assert_marker(place_out + place_err, "INVALID_PLACEMENT_ZONE", "stable invalid-zone error code")
    finally:
        cleanup(processes)
    assert_unplaced(args, RECEIPT_IDS["zone_delete"])
    print("SCKRL-311 concurrency checks passed: replay/key races, review-save/parse-promotion/parse-failure freeze, membership lock, zone-delete ordering, and opposing-order multi-zone locks.")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--psql-bin", required=True)
    parser.add_argument("--host", required=True)
    parser.add_argument("--port", type=int, required=True)
    parser.add_argument("--user", required=True)
    parser.add_argument("--database", required=True)
    parser.add_argument("--blocking-timeout", type=float, default=12)
    args = parser.parse_args()
    try:
        run(args)
    except (OSError, subprocess.SubprocessError, RuntimeError) as error:
        print(f"SCKRL-311 concurrency check failed: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
