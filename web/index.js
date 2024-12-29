import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-auth.js";
import { getFunctions } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-functions.js";
import { getDatabase, ref, set, get, push, onValue } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-database.js";


const firebaseConfig = { 
    apiKey : "AIzaSyDm9JTh2asPyvghYfTThNuYe2vESgvRTfw" , 
    authDomain : "iot-watering-caf9b.firebaseapp.com" , 
    databaseURL : "https://iot-watering-caf9b-default-rtdb.asia-southeast1.firebasedatabase.app" , 
    projectId : "iot-watering-caf9b" , 
    storageBucket : "iot-watering-caf9b.firebasestorage.app" , 
    messagingSenderId : "255169422238" , 
    appId : "1:255169422238:web:5368795df5ee2c3009ec8f" , 
    measurementId : "G-TQYZKNEL5B" 
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const functions = getFunctions(app);
const database = getDatabase(app);


$("#btn-login").click(function(){ 
    var email = $("#email").val();
    var password = $("#password").val();
    
    if(email != "" && password != ""){
        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log(userCredential);
                window.alert("Login successful");
                // Redirect to homepage or another page
                window.location.href = "homepage.html";
            })
            .catch((error) => {
                var errorCode = error.code;
                var errorMessage = error.message;

                console.log(errorCode);
                console.log(errorMessage);
                
                window.alert("Message : " + errorMessage);
            });
    } else {
        window.alert("Vui lòng điền đủ tất cả các trường.");
    }
});

$("#btn-logout").click(function(){ 
    signOut(auth).then(() => {
        console.log("User signed out");
        window.alert("Logout successful");
        // Redirect to login page or another page
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Sign out error", error);
        window.alert("Sign out error: " + error.message);
    });
});

$("#btn-signup").click(function(){ 
    var email = $("#email").val();
    var password = $("#password").val();
    var cPassword = $("#confirmPassword").val();

    if(email != "" && password != "" && cPassword != ""){
        if(password === cPassword){
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log(userCredential);
                    window.alert("Signup successful");
                    // Redirect to homepage or another page
                    window.location.href = "login.html";
                })
                .catch((error) => {
                    var errorCode = error.code;
                    var errorMessage = error.message;

                    console.log(errorCode);
                    console.log(errorMessage);
                    
                    window.alert("Message : " + errorMessage);
                });
        } else {
            window.alert("Passwords do not match.");
        }
    } else {
        window.alert("Vui lòng điền đủ tất cả các trường.");
    }
});

export function addDevice(deviceKey, deviceName) {
    if (deviceKey && deviceName) {
        const keysRef = ref(database, 'keys');
        get(keysRef).then((snapshot) => {
            if (snapshot.exists()) {
                const keys = snapshot.val();
                console.log('Keys from database:', keys);

                // Kiểm tra xem deviceKey có trong danh sách giá trị của Keys không
                const keyExists = Object.entries(keys).some(([key, value]) => value === deviceKey);

                if (keyExists) {
                    console.log('Key exists:', deviceKey);
                    const deviceRef = ref(database, 'Plant_Watering/Devices/' + deviceKey);
                    get(deviceRef).then((deviceSnapshot) => {
                        if (deviceSnapshot.exists()) {
                            alert('Thiết bị với key này đã tồn tại.');
                        } else {
                            set(deviceRef, {
                                name: deviceName
                            }).then(() => {
                                alert('Thiết bị mới đã được thêm thành công!');
                                document.getElementById('add-device-form').reset();
                                window.parent.postMessage('deviceAdded', '*'); // Notify parent window
                            }).catch((error) => {
                                console.error('Đã xảy ra lỗi:', error);
                            });
                        }
                    }).catch((error) => {
                        console.error('Đã xảy ra lỗi:', error);
                    });
                } else {
                    console.log('Key does not exist:', deviceKey);
                    alert('Key không hợp lệ. Vui lòng kiểm tra lại.');
                }
            } else {
                console.log('No keys found in database.');
                alert('Không tìm thấy key nào trong cơ sở dữ liệu.');
            }
        }).catch((error) => {
            console.error('Đã xảy ra lỗi:', error);
        });
    } else {
        alert('Vui lòng điền đầy đủ thông tin thiết bị.');
    }
}

// Function to save humidity history
export function saveHumidityHistory(deviceKey, humidity) {
    const database = getDatabase();
    const historyRef = ref(database, `Plant_Watering/Devices/${deviceKey}/historyHumid`);
    const newHistoryRef = push(historyRef);
    set(newHistoryRef, {
        humidity: humidity,
        timestamp: Date.now()
    }).catch((error) => {
        console.error('Error saving humidity history:', error);
    });
}

export { auth };