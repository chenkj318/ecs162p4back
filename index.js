// index.js
// This is our main server file
import fetch from 'node-fetch';
// include express
import express from 'express';
// create object to interface with express
const app = express();
app.use(express.json());
let monthDays = {
  1: 31,
  2: 28,
  3: 31,
  4: 30,
  5: 31,
  6: 30,
  7: 31,
  8: 31,
  9: 30,
  10: 31,
  11: 30,
  12: 31
}

function dateFormat(date) {
  const y = date.getFullYear();
  let m = date.getMonth();
  let d = date.getDate();
  m = m < 10 ? '0'+ m : m;
  d = d < 10 ? '0' + d : d;
  return `${y}-${m}-${d}`;
}

function getWaters(start, end) {
  let start_date = dateFormat(new Date(start)),
      end_date = dateFormat(new Date(end));
  const url = `
    https://cdec.water.ca.gov/dynamicapp/req/JSONDataServlet?Stations=SHA,ORO,CLE,NML,LUS,DNP,BER&SensorNums=15&dur_code=M&Start=${start_date}&End=${end_date}
  `;
  console.log(url);
  return fetch(url);
}

// Code in this section sets up an express pipeline
app.get('/api/waters/:start/:end', async (req, res) => {
  try {
    console.log(req);
    const {start, end} = req.params;

    const httpRes = await getWaters(Number(start), Number(end));
    console.log("httpRes:",httpRes)
    const data = await httpRes.json();
    let watersData = [];
    let stationIDMap = {};
    data.forEach(item => {
      if (!stationIDMap[item.stationId]) {
        stationIDMap[item.stationId] = 1;
      } else {
        stationIDMap[item.stationId] ++;
      }
      let oldItem = watersData.find(waterData => {
        return waterData.stationId === item.stationId;
      });
      if (!oldItem) {
        watersData.push(item);
      } else {
        oldItem.value += item.value;
      }
    });
    watersData = watersData.map(item => {
      item.value = Math.ceil(item.value / stationIDMap[item.stationId]);
      return item;
    })
    console.log("watersData:",watersData);
    console.log("stationIDMap:",stationIDMap);
    res.status(200).json(watersData);
  } catch (err) {
    return res.status(500).json(err);
  }
});
// print info about incoming HTTP request 
// for debugging
app.use(function(req, res, next) {
  console.log(req.method,req.url);
  next();
})

// No static server or /public because this server
// is only for AJAX requests

// respond to all AJAX querires with this message
app.use(function(req, res, next) {
  res.json({msg: "No such AJAX request"})
});

// end of pipeline specification

// Now listen for HTTP requests
// it's an event listener on the server!
const listener = app.listen(process.env.PORT || 3000, function () {
  console.log("The static server is listening on port " + listener.address().port);
});
