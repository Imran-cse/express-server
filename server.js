const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

const activeUsers = new Map();

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("register", (userId) => {
    activeUsers.set(socket.id, userId);
    io.emit("activeUsers", Array.from(activeUsers.values()));
  });

  socket.on("call-user", ({ userToCall, offer }) => {
    const userSocketId = Array.from(activeUsers.entries()).find(
      ([_, id]) => id === userToCall
    )?.[0];

    if (userSocketId) {
      io.to(userSocketId).emit("incoming-call", {
        from: activeUsers.get(socket.id),
        offer,
      });
    }
  });

  socket.on("answer-call", ({ to, answer }) => {
    const userSocketId = Array.from(activeUsers.entries()).find(
      ([_, id]) => id === to
    )?.[0];

    if (userSocketId) {
      io.to(userSocketId).emit("call-accepted", answer);
    }
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    const userSocketId = Array.from(activeUsers.entries()).find(
      ([_, id]) => id === to
    )?.[0];

    if (userSocketId) {
      io.to(userSocketId).emit("ice-candidate", candidate);
    }
  });

  socket.on("disconnect", () => {
    activeUsers.delete(socket.id);
    io.emit("activeUsers", Array.from(activeUsers.values()));
  });
});

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
