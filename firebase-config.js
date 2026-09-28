// Import the functions you need from the SDKs you need import { initializeApp } from "firebase/app"; import { getAnalytics } from "firebase/analytics"; // TODO: Add SDKs for Firebase products that you want to use // 
https://firebase.google.com/docs/web/setup#available-libraries 

// Your web app's Firebase configuration // For Firebase JS SDK v7.20.0 and later, measurementId is optional 
const firebaseConfig = { apiKey: "AIzaSyDfQqxyAoIL0Z8CA7pX3nA5JL8hwvvfk4E", authDomain: "
http://gym-together-a20e4.firebaseapp.com", databaseURL: "
https://gym-together-a20e4-default-rtdb.europe-west1.firebasedatabase.app", projectId: "gym-together-a20e4", storageBucket: "gym-together-a20e4.firebasestorage.app", messagingSenderId: "377619804156", appId: "1:377619804156:web:afb88beaa4025acc660c79", measurementId: "G-0M5XX5JKLW" }; 

// Initialize Firebase 
const app = initializeApp(firebaseConfig); const analytics = getAnalytics(app);
