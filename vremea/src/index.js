import { ActivityIndicator, SafeAreaView, Text, View, StyleSheet, RefreshControl, ScrollView,
    Image, FlatList, TextInput, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Entypo from 'react-native-vector-icons/Entypo';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import React, { useEffect, useState } from 'react';
import { WEATHER_API_KEY } from '@env';

const Weather = () => {
   const [forecast, SetForecast] = useState(null);
   const [searchValue, setSearchValue] = useState('');
   const [suggestions, setSuggestions] = useState(null);
   const [lastSearchedLocation, setLastSearchedLocation] = useState({ location: 'Bucharest', country: 'Romania' });
   const [refreshing, setRefreshing] = useState(false);

   const handleSearch = async (value) => {
       setSearchValue(value);
       const response1 = await fetch(`https://api.weatherapi.com/v1/search.json?key=${WEATHER_API_KEY}&q=${value}`);
       const data1 = await response1.json();
       if (!response1.ok) {
           return;
       } else {
           setSuggestions(data1);
       }
   };

   const handleSuggestionPress = async (value, value1) => {
        setSearchValue('');
        setSuggestions(null);
        loadForecast(value, value1);
   };

   const loadForecast = async (value, value1) => {
    if (!value || !value1) {
        console.error("Invalid location data:", value, value1);
        return;
    }
     const response = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=${value},${value1}&days=1&aqi=no&alerts=no`);
     const data = await response.json();

     if (!response.ok) {
       const response1 = await fetch(`https://api.weatherapi.com/v1/forecast.json?key=${WEATHER_API_KEY}&q=Bucharest&days=1&aqi=no&alerts=no`);
       const data1 = await response1.json();
       setLastSearchedLocation({ location: 'Bucharest', country: 'Romania' });
       SetForecast(data1);
     } else {
       SetForecast(data);
     }
     setLastSearchedLocation({ location: value, country: value1 });
   };

   const onRefresh = async () => {
    setRefreshing(true);
    await loadForecast(lastSearchedLocation.location, lastSearchedLocation.country);
    setSearchValue('');
    setSuggestions('');
    setRefreshing(false);
};

   useEffect(() => {
    const loadStoredLocation = async () => {
        try {
            const storedLocation = await AsyncStorage.getItem('lastSearchedLocation');
            if (storedLocation) {
                const { location, country } = JSON.parse(storedLocation);
                loadForecast(location, country);
            } else {
                loadForecast('Bucharest', '');
            }
        } catch (error) {
            console.error('Error loading stored location:', error);
        }
    };
    loadStoredLocation();
}, []);

useEffect(() => {
    const saveLocationToStorage = async () => {
        try {
            await AsyncStorage.setItem('lastSearchedLocation', JSON.stringify(lastSearchedLocation));
        } catch (error) {
            console.error('Error saving location to storage:', error);
        }
    };
    saveLocationToStorage();
}, [lastSearchedLocation]);

   if (!forecast) {
       return (
           <SafeAreaView style={styles.loading}>
               <ActivityIndicator size='large'></ActivityIndicator>
           </SafeAreaView>
       );
   }

   return (
    <SafeAreaView style={styles.container}>
       <ScrollView
           style={{ marginTop: 50 }}
           refreshControl={
            <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
            />
        }
       >
           <View style={styles.search}>
               <View style={styles.search1}>
                   <TextInput style={styles.searchBar}
                       placeholder='Search city'
                       onChangeText={handleSearch}
                       value={searchValue}
                   />
                   <Pressable style={styles.searchButton}
                              onPress={() => suggestions && suggestions.length > 0 && handleSuggestionPress(suggestions[0].name, suggestions[0].country)}
                   >
                       <Text style={{ color: 'white' }}>Search</Text>
                   </Pressable>
               </View>
               <FlatList
                       style={styles.suggestions}
                       contentContainerStyle={styles.suggestionsContainer}
                       horizontal
                       data={suggestions}
                       keyExtractor={(item, index) => index.toString()}
                       renderItem={(suggestions) => (
                           <View>
                                <Pressable onPress={() => handleSuggestionPress(suggestions.item.name, suggestions.item.country)}>
                                    <Text style={styles.suggestionText}>{suggestions.item.name}, {suggestions.item.country}</Text>
                                </Pressable>
                                <View style={styles.separator}></View>
                           </View>
                       )}
                   />
           </View>
           <Text style={styles.title}>
               Weather
           </Text>
           <Text style={styles.location}>
               {forecast.location.name}, {forecast.location.country}
           </Text>
           <View style={styles.current}>
               <Image
                   style={styles.largeIcon}
                   source={{
                       uri: `https:${forecast.current.condition.icon}`
                   }}
               />
               <Text style={styles.currentTemp}>
                   {forecast.current.temp_c}°C
               </Text>
           </View>
           <Text style={styles.currentDescription}>
                   {forecast.current.condition.text}
           </Text>
           <View style={styles.extraInfo}>
               <View style={styles.info}>
                    <FontAwesome name='thermometer-4'
                             style={styles.temperature} />
                   <Text style={styles.text}>
                       {forecast.current.feelslike_c}°C
                   </Text>
                   <Text style={styles.text}>
                       Feels like
                   </Text>
               </View>
               <View style={styles.info}>
                    <Entypo name='drop'
                            style={styles.drop} />
                   <Text style={styles.text}>
                       {forecast.current.humidity}%
                   </Text>
                   <Text style={styles.text}>
                       Humidity
                   </Text>
               </View>
           </View>
           <View>
               <Text style={styles.subtitle}>Hourly Forecast</Text>
           </View>
           <FlatList
               horizontal
               data={forecast.forecast.forecastday[0].hour.slice(0, 24)}
               keyExtractor={(item, index) => index.toString()}
               renderItem={(hour) => {
                   var time = new Date(hour.item.time);
                   return (
                       <View style={styles.hour}>
                           <Text style={{ fontWeight: 'bold', color: '#3E64FF' }}>
                               {time.toLocaleTimeString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                           </Text>
                           <Text style={{ fontWeight: 'bold', color: '#3E64FF' }}>
                               {Math.round(hour.item.temp_c)}°C
                           </Text>
                           <Image
                               style={styles.smallIcon}
                               source={{
                                   uri: `https:${hour.item.condition.icon}`,
                               }}
                           />
                           <Text style={{ fontWeight: 'bold', color: '#3E64FF' }}>
                               {hour.item.condition.text}
                           </Text>
                       </View>
                   )
               }}
           />
       </ScrollView>
     </SafeAreaView>
   );
}

export default Weather;

const styles = StyleSheet.create({
   container: {
       flex: 1,
       backgroundColor: '#E8F0FF',
     },
   title: {
       textAlign: 'center',
       fontSize: 36,
       fontWeight: 'bold',
       color: '#3E64FF',
       marginTop: 30,
   },
   current: {
       flexDirection: 'row',
       justifyContent: 'center',
       alignItems: 'center',
       marginTop: 20
   },
   location: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3E64FF',
    marginTop: 20,
    marginBottom: 20
  },
   largeIcon: {
       width: 100,
       height: 100,
       marginRight: 10,
       paddingBottom: 50
   },
   currentTemp: {
       fontSize: 32,
       fontWeight: 'bold',
       alignItems: 'center',
       justifyContent: 'center',
       color: '#3E64FF',
   },
   currentDescription: {
       width: '100%',
       textAlign: 'center',
       fontWeight: '500',
       fontSize: 18,
       marginBottom: 20,
       color: '#3E64FF',
   },
   info: {
       width: '45%',
       backgroundColor: '#3E64FF',
       padding: 10,
       borderRadius: 15,
       justifyContent: 'center',
       alignItems: 'center',
       marginBottom: 20,
   },
   extraInfo: {
       flexDirection: 'row',
       marginTop: 10,
       padding: 10,
       justifyContent: 'space-between',
   },
   text: {
       fontSize: 20,
       color: '#fff',
       textAlign: 'center',
       marginBottom: 2
   },
   subtitle: {
       fontSize: 24,
       marginTop: 12,
       textAlign: 'center',
       color: '#3E64FF',
       fontWeight: 'bold',
       marginBottom: 10
   },
   hour: {
       padding: 6,
       alignItems: 'center',
       marginLeft: 15,
       marginRight: 15,
       marginTop: 30,
       marginBottom: 25
   },
   smallIcon: {
       width: 100,
       height: 100,
   },
   search: {
       marginHorizontal: 20,
       marginTop: 20,
   },
   search1: {
       justifyContent: 'space-between',
       flexDirection: 'row',
       alignItems: 'center',
   },
   searchBar: {
       backgroundColor: '#fff',
       paddingHorizontal: 15,
       paddingVertical: 10,
       borderRadius: 20,
       borderWidth: 1,
       borderColor: '#3E64FF',
       fontSize: 16,
       flexGrow: 1
   },
   searchButton: {
       backgroundColor: '#3E64FF',
       paddingHorizontal: 20,
       paddingVertical: 10,
       borderRadius: 20,
       marginLeft: 10,
   },
   suggestions: {
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
   },
   suggestionsContainer: {
    flexDirection: 'column',
},
   suggestionText: {
    padding: 10,
    fontSize: 16,
    color: '#333',
   },
   separator: {
    height: 1,
    backgroundColor: 'ccc'
   },
   drop: {
    marginTop: 3,
    fontSize: 30,
    color: '#00e2ff',
    borderRadius: 40 / 2,
    marginBottom: 12,
    marginRight: 5
   },
   temperature: {
    marginTop: 3,
    fontSize: 30,
    color: '#ff7100',
    borderRadius: 40 / 2,
    marginBottom: 12
   }
});
