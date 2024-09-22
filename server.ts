import { Server } from "socket.io";

process.on("uncaughtException", (err) => {
  console.log("UNHANDLED Exception! Shutting down...");
  console.log(err);
  process.exit(1);
});

import app from "./app";

const port = process.env.PORT || 8000;

const server = app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

io.on("connection", (socket) => {
  socket.on("join-chat", (chatId) => {
    socket.join(chatId);
  });

  socket.on("chat-message", (data) => {
    const parsedData = JSON.parse(data);
    io.to(parsedData.chatId).emit("received-message", data);
  });

  socket.on("disconnect", () => {});
});
