import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, Text, StyleSheet, FlatList, TouchableOpacity, Switch, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {
  const [password, setPassword] = useState("");
  const [storedPassword, setStoredPassword] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [entry, setEntry] = useState("");
  const [entries, setEntries] = useState([]);
  const [search, setSearch] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  // Load saved password + entries + theme
  useEffect(() => {
    const loadData = async () => {
      const savedPass = await AsyncStorage.getItem("diaryPassword");
      if (savedPass) setStoredPassword(savedPass);

      const savedEntries = await AsyncStorage.getItem("diaryEntries");
      if (savedEntries) setEntries(JSON.parse(savedEntries));

      const savedTheme = await AsyncStorage.getItem("diaryTheme");
      if (savedTheme) setDarkMode(savedTheme === "dark");
    };
    loadData();
  }, []);

  // Save theme preference
  const toggleTheme = async () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    await AsyncStorage.setItem("diaryTheme", newMode ? "dark" : "light");
  };

  // Save a new password
  const savePassword = async () => {
    if (!password.trim()) return;
    await AsyncStorage.setItem("diaryPassword", password);
    setStoredPassword(password);
    alert("Password set successfully!");
  };

  // Unlock diary
  const unlockDiary = () => {
    if (password === storedPassword) {
      setUnlocked(true);
    } else {
      alert("Wrong password!");
    }
  };

  // Logout diary
  const logoutDiary = () => {
    setUnlocked(false);
    setPassword("");
  };

  // Change password
  const changePassword = async () => {
    if (!newPassword.trim()) return;
    await AsyncStorage.setItem("diaryPassword", newPassword);
    setStoredPassword(newPassword);
    setNewPassword("");
    alert("Password changed successfully!");
  };

  // Save or update entry
  const saveEntry = async () => {
    if (!entry.trim()) return;

    let updatedEntries;
    if (editingIndex !== null) {
      // Update existing entry
      updatedEntries = [...entries];
      updatedEntries[editingIndex] = {
        ...updatedEntries[editingIndex],
        text: entry,
        date: new Date().toLocaleString() + " (edited)"
      };
      setEditingIndex(null);
    } else {
      // Add new entry
      const newEntry = { text: entry, date: new Date().toLocaleString() };
      updatedEntries = [newEntry, ...entries];
    }

    setEntries(updatedEntries);
    await AsyncStorage.setItem("diaryEntries", JSON.stringify(updatedEntries));
    setEntry("");
  };

  // Delete an entry with confirmation
  const confirmDeleteEntry = (index) => {
    Alert.alert(
      "Delete Entry",
      "Are you sure you want to delete this entry?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteEntry(index) }
      ]
    );
  };

  const deleteEntry = async (index) => {
    const updatedEntries = entries.filter((_, i) => i !== index);
    setEntries(updatedEntries);
    await AsyncStorage.setItem("diaryEntries", JSON.stringify(updatedEntries));
  };

  // Start editing an entry
  const editEntry = (index) => {
    setEntry(entries[index].text);
    setEditingIndex(index);
  };

  // Filter entries by search keyword
  const filteredEntries = entries.filter(e =>
    e.text.toLowerCase().includes(search.toLowerCase())
  );

  const themeStyles = darkMode ? darkTheme : lightTheme;

  // Password screen
  if (!unlocked) {
    return (
      <View style={themeStyles.container}>
        <Text style={themeStyles.title}>
          {storedPassword ? "🔒 Enter Password" : "🔑 Set a New Password"}
        </Text>
        <TextInput
          style={themeStyles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {storedPassword ? (
          <Button title="Unlock" onPress={unlockDiary} />
        ) : (
          <Button title="Set Password" onPress={savePassword} />
        )}
      </View>
    );
  }

  // Diary screen
  return (
    <View style={themeStyles.container}>
      <Text style={themeStyles.title}>🌱 Secret Garden Diary</Text>

      <Button title="Logout" onPress={logoutDiary} />

      <Switch value={darkMode} onValueChange={toggleTheme} />
      <Text style={themeStyles.text}>{darkMode ? "Dark Mode" : "Light Mode"}</Text>

      {/* Change Password Section */}
      <Text style={themeStyles.text}>Change Password</Text>
      <TextInput
        style={themeStyles.input}
        placeholder="Enter new password"
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      <Button title="Update Password" onPress={changePassword} />

      {/* Diary Entry Section */}
      <TextInput
        style={themeStyles.input}
        placeholder={editingIndex !== null ? "Edit your entry..." : "Write your thoughts..."}
        value={entry}
        onChangeText={setEntry}
        multiline
      />
      <Button title={editingIndex !== null ? "Update Entry" : "Save Entry"} onPress={saveEntry} />

      <TextInput
        style={themeStyles.search}
        placeholder="Search entries..."
        value={search}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredEntries}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <View style={themeStyles.entry}>
            <Text style={themeStyles.date}>{item.date}</Text>
            <Text style={themeStyles.text}>{item.text}</Text>
            <View style={{ flexDirection: "row", marginTop: 5 }}>
              <TouchableOpacity onPress={() => editEntry(index)} style={themeStyles.editButton}>
                <Text style={themeStyles.editText}>✏️ Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => confirmDeleteEntry(index)} style={themeStyles.deleteButton}>
                <Text style={themeStyles.deleteText}>🗑 Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const lightTheme = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fdf6f0" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#000" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 10, borderRadius: 8, color: "#000" },
  search: { borderWidth: 1, borderColor: "#aaa", padding: 8, marginVertical: 10, borderRadius: 8, color: "#000" },
  entry: { marginTop: 15, padding: 10, backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#ddd" },
  date: { fontSize: 12, color: "gray", marginBottom: 5 },
  text: { fontSize: 16, color: "#000" },
  editButton: { marginRight: 10, padding: 5, backgroundColor: "#e5f0ff", borderRadius: 5 },
  editText: { color: "blue", fontWeight: "bold" },
  deleteButton: { padding: 5, backgroundColor: "#ffe5e5", borderRadius: 5 },
  deleteText: { color: "red", fontWeight: "bold" },
});

const darkTheme = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#1c1c1c" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, color: "#fff" },
  input: { borderWidth: 1, borderColor: "#555", padding: 10, marginBottom: 10, borderRadius: 8, color: "#fff", backgroundColor: "#2a2a2a" },
  search: { borderWidth: 1, borderColor: "#666", padding: 8, marginVertical: 10, borderRadius: 8, color: "#fff", backgroundColor: "#2a2a2a" },
  entry: { marginTop: 15, padding: 10, backgroundColor: "#2a2a2a", borderRadius: 8, borderWidth: 1, borderColor: "#444" },
  date: { fontSize: 12, color: "#b0b0b0", marginBottom: 5 },
  text: { fontSize: 16, color: "#fff" },
  editButton: { marginRight: 10, padding: 5, backgroundColor: "#2d3b4f", borderRadius: 5 },
  editText: { color: "#88b7ff", fontWeight: "bold" },
  deleteButton: { padding: 5, backgroundColor: "#4d2b2b", borderRadius: 5 },
  deleteText: { color: "#ff9a9a", fontWeight: "bold" },
});