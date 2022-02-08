const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./model/user");

const JWT_SECRET = "helloworld";
const app = express();
app.use("/", express.static(path.join(__dirname, "static")));
app.use(bodyParser.json());

mongoose.connect('mongodb://localhost:27017/jwt');

app.post("/api/change-pwd", async (req, res) => {
    const { token, newPassword } = req.body;
    try {
        const user = jwt.verify(token, JWT_SECRET);
        console.log(user);
        if (!newPassword || typeof newPassword !== "string") {
            res.json({ status: "error", error: "invalid password" });
        }
        else {
            const _id = user.id;
            const password = await bcrypt.hash(newPassword, 10);
            await User.updateOne({ _id: _id }, { password: password });
            res.json({ status: "ok", data: password });
        }
    } catch (error) {
        res.json({ status: "error", error: "authentication failed" });
    }
});

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username });
    if (user) {
        const result = await bcrypt.compare(password, user.password);
        if (result) {
            const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET);
            res.json({ status: "ok", data: token });
        }
        else {
            res.json({ status: "error", error: "incorrect username/password" });
        }
    }
    else {
        res.json({ status: "error", error: "incorrect username/password" });
    }
});

app.post("/api/register", async (req, res) => {
    const username = req.body.username;
    const plainTextPassword = req.body.password;
    if (!username || typeof username !== 'string') {
        res.json({ status: "error", error: "invalid username" });
    }
    else if (!plainTextPassword || typeof plainTextPassword !== 'string') {
        res.json({ status: "error", error: "invalid plainTextPassword" });
    }
    else {
        const password = await bcrypt.hash(plainTextPassword, 10);
        try {
            const response = await User.create({
                username: username,
                password: password
            });
            console.log("user created!", response);
            res.json({ status: "ok" });
        } catch (error) {
            console.log(JSON.stringify(error));
            if (error.code === 11000) {
                res.json({ status: "error", error: "username already exist" });
            }
            else
                throw error;
        }
    }
})

app.listen(80, () => {
    console.log("port 80");
});