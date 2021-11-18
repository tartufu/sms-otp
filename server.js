// boiler plate
const express = require("express");
const app = express();
const port = 3000;

// utils
const fs = require("fs");
const csv = require("csv-parser");

app.use(express.json());

// CONSTS
const dbPath = "records.csv";

app.get("/", (req, res) => {
    let otp = generateOtp();
    res.send(otp);
});

app.post("/generate", (req, res) => {
    let otp = generateOtp();
    let timestamp = new Date();
    res.send(otp);

    let data = {
        identifier: req.body.identifier,
        mobile: req.body.mobile,
        otp: otp,
        timestamp: timestamp,
    };

    writeToDb(data);
});

app.post("/verify", async (req, res) => {
    console.log(req.body);

    let isValid = await verifyAgainstDb(req.body);

    if (isValid) {
        res.send("true");
    } else {
        res.send("false");
    }
});

const generateOtp = () => {
    let otp = Math.random().toString().substr(2, 6);
    return otp;
};

const writeToDb = (data) => {
    let newData = `${data.identifier},${data.mobile},${data.otp},${data.timestamp}\r\n`;
    console.log(newData);
    fs.appendFile(dbPath, newData, function (err) {
        if (err) throw err;
        console.log("Saved!");
    });
};

const verifyAgainstDb = (data) => {
    console.log(data);

    let records = [];

    return new Promise((resolve, reject) => {
        fs.createReadStream(dbPath)
            .pipe(csv())
            .on("data", (row) => {
                // console.log(row);
                records.push(row);
            })
            .on("end", () => {
                records = records.reverse();

                let isValid = false;

                for (let i = 0; i < records.length; i++) {
                    let currentTime = new Date();
                    let requestTime = new Date(records[i].timestamp);

                    let diffInTime =
                        (currentTime.getTime() - requestTime.getTime()) / 1000;

                    console.log(diffInTime);
                    if (
                        data.identifier === records[i].identifier &&
                        data.mobile === records[i].mobile &&
                        data.otp === records[i].otp &&
                        diffInTime < 300
                    ) {
                        console.log("verified");
                        isValid = true;
                        // to change verified status to true
                        break;
                    } else {
                        // console.log("not verified");
                    }
                }

                resolve(isValid);
            });
    });
};

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});
