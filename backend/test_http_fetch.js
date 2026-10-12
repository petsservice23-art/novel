const axios = require('axios');

const run = async () => {
  try {
    const res = await axios.get('http://localhost:5000/api/chapters/novel/6a0cdfb57e4dd1ba64798877');
    console.log("Status Code:", res.status);
    console.log("Data is Array:", Array.isArray(res.data));
    console.log("Data length:", res.data.length);
    console.log("Data sample:", res.data[0]);
  } catch (e) {
    console.error("HTTP Error:", e.message);
    if (e.response) {
      console.error("Response data:", e.response.data);
    }
  }
};

run();
