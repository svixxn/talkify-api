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
  socket.on("join-chats", (chatIds) => {
    socket.join(chatIds);
  });

  socket.on("chat-message", (data) => {
    const parsedData = JSON.parse(data);
    socket.to(parsedData.chatId).emit("received-message", data);
  });

  socket.on("is-typing", (currentChatId) => {
    socket.to(currentChatId).emit("is-typing");
  });

  socket.on("stopped-typing", (currentChatId) => {
    socket.to(currentChatId).emit("stopped-typing");
  });

  socket.on("delete-chat", (chatId) => {
    socket.to(chatId).emit("delete-chat", chatId);
  });

  socket.on("leave-chats", (chatIds) => {
    socket.leave(chatIds);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});
