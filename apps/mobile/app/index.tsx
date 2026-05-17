import { Text, View } from 'react-native';

export default function IndexRoute() {
  return (
    <View
      style={{
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <Text>Sackerl</Text>
      <Text>Framework scaffold ready. Product UI starts after the design handoff.</Text>
    </View>
  );
}
