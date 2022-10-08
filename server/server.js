//fireabase
var cron = require('node-cron');
const express = require('express')
const app = express()
var admin = require('firebase-admin')
var serviceAccount = require("./serviceAccountKey.json");
const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, Timestamp, FieldValue } = require('firebase-admin/firestore');

var firebaseConfig = {
  apiKey: "AIzaSyALvxlohJ9hI7gKyhb2t69vxzCN9Tad9Zg",
  authDomain: "waterlevelmonitor-ca990.firebaseapp.com",
  databaseURL: "https://waterlevelmonitor-ca990-default-rtdb.firebaseio.com",
  projectId: "waterlevelmonitor-ca990",
  storageBucket: "waterlevelmonitor-ca990.appspot.com",
  messagingSenderId: "104980360186",
  appId: "1:104980360186:web:11942dbafb5212e1bb1243",
  measurementId: "G-TZC1HP95KH"
}
//service account initialisation

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://waterlevelmonitor-ca990-default-rtdb.firebaseio.com"
});

const db =getFirestore()

let temp=-1

function getLevel(){
  let database = admin.database()
  //reading value
  database.ref('pool1/distance').once('value')
  .then(function(snapshot) {
      temp=snapshot.val()
      console.log(temp)
  }).then(function(){
    pushLevel();
  })
}
//express
//firestoree

//function to push value to database
function pushLevel(){
  const docRef = db.collection('levels').doc();
  docRef.set({
    level:temp,
    createdAt:Date.now()
  }).then(function(){
    avgTenDayLevel=0
    CalcAvgTenDayLevel()
  })
}
//get level for 10 days
var avgTenDayLevel
var levelten=[]
var levelDayOne
function CalcAvgTenDayLevel(){
  
  const docRefs = db.collection('levels')
  const lastThreeRes = docRefs.orderBy('createdAt','desc').limit(10).get().then((snapshot)=>{
    snapshot.docs.forEach(doc=>{
      var lev = doc.get("level")
      //console.log(lev);
      //console.log(doc.get("createdAt"));
      levelten.push(lev);
      });
  })
  setTimeout(function() { 
    levelDayOne=levelten[9]
    console.log("level day one : "+ levelDayOne); 
    for(var i=0;i<10;i++){
      console.log(levelten[i])
      
      avgTenDayLevel=avgTenDayLevel+levelten[i];

    }
    avgTenDayLevel=avgTenDayLevel/10
    console.log("avg ten day level : "+ avgTenDayLevel)
  }, 2000)
    levelten =[]
}


//function to return values to the client

function toClient(){
  console.log("current value "+temp)
  console.log("this avg level in toclient() : " +avgTenDayLevel)
  var level1 = 500-temp-20
  var level2 =500-avgTenDayLevel-20 
  var level3 =levelDayOne-temp 
  var templvl =(300*10000*Math.abs(level3)/1000)
  if(level3>0){
    level3=templvl + " litres / "+(templvl *0.264172).toFixed(3)+" gallons used"
  }else{
    level3=templvl + " litres /" +(templvl*0.264172).toFixed(3)+" gallons collected"
  }
  
  app.get("/api",(req,res)=>{

      res.json({"levels":[level1 +" .c.m",level2 + " .c.m",level3]})
  })

  app.listen(5000,()=>{
      console.log("server started on port 5000")
  })
}


cron.schedule('* * * * *', () => {
  console.log('pushing level :'+temp + " at " + Date.now());
  getLevel()
 
});

getLevel();
setTimeout(function(){toClient() }, 6000);


