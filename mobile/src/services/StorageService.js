import AsyncStorage from '@react-native-async-storage/async-storage';

class StorageService {
  static KEYS = {
    USER_DATA: 'user_data',
    USERNAME: 'username',
    USER_ID: 'user_id',
  };

  async setUserData(userData) {
    try {
      await AsyncStorage.setItem(StorageService.KEYS.USER_DATA, JSON.stringify(userData));
      await AsyncStorage.setItem(StorageService.KEYS.USERNAME, userData.username);
      await AsyncStorage.setItem(StorageService.KEYS.USER_ID, userData.id.toString());
    } catch (error) {
      console.error('Error saving user data:', error);
      throw error;
    }
  }

  async getUserData() {
    try {
      const userData = await AsyncStorage.getItem(StorageService.KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  async getUsername() {
    try {
      return await AsyncStorage.getItem(StorageService.KEYS.USERNAME);
    } catch (error) {
      console.error('Error getting username:', error);
      return null;
    }
  }

  async getUserId() {
    try {
      const userId = await AsyncStorage.getItem(StorageService.KEYS.USER_ID);
      return userId ? parseInt(userId) : null;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  async clearUserData() {
    try {
      await AsyncStorage.multiRemove([
        StorageService.KEYS.USER_DATA,
        StorageService.KEYS.USERNAME,
        StorageService.KEYS.USER_ID,
      ]);
    } catch (error) {
      console.error('Error clearing user data:', error);
      throw error;
    }
  }

  async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      await AsyncStorage.setItem(key, stringValue);
    } catch (error) {
      console.error(`Error setting item ${key}:`, error);
      throw error;
    }
  }

  async getItem(key) {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value === null) return null;
      
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error(`Error getting item ${key}:`, error);
      return null;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing item ${key}:`, error);
      throw error;
    }
  }

  async getAllKeys() {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error('Error getting all keys:', error);
      return [];
    }
  }

  async clear() {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
}

export default new StorageService();