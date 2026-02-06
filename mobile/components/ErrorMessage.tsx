import { View, Text, TouchableOpacity } from 'react-native';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <View className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
      <Text className="text-red-800 font-semibold mb-2">Greška</Text>
      <Text className="text-red-700 text-sm mb-3">{message}</Text>
      {onRetry && (
        <TouchableOpacity
          className="bg-red-600 rounded-lg py-2 px-4 self-start"
          onPress={onRetry}
        >
          <Text className="text-white font-semibold">Pokušaj ponovo</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
