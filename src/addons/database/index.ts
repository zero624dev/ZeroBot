import mongoose from "mongoose";
import { colors, MONGODB_URI } from "../../config";
import { client } from "../../bot";
import { sendLog } from "../../core/logger";
import { StringUtils } from "../../core/utils/utils";

const options = {
  autoIndex: true, // Build indexes
  connectTimeoutMS: 60000, // Give up initial connection after 10 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
};

function setRunValidators(this: mongoose.Query<any, any>) {
  this.setOptions({ runValidators: true });
}

mongoose.set("strictQuery", true);

// Create the database connection
mongoose
  .plugin((schema: any) => {
    schema.pre("findOneAndUpdate", setRunValidators);
    schema.pre("updateMany", setRunValidators);
    schema.pre("updateOne", setRunValidators);
    schema.pre("update", setRunValidators);
  })
  .connect(MONGODB_URI, options)
  .then(() => {
    console.log("Mongoose connection done");
  })
  .catch((e) => {
    console.log("Mongoose connection error");
    sendLog(client, {
      embeds: [{
        title: "Mongoose connection error",
        description: `<t:${Math.floor(Date.now() / 1000)}:R>`,
        color: colors.error,
      }],
    });
    console.error(e);
  });

// CONNECTION EVENTS
// When successfully connected
// mongoose.connection.on('connected', () => {
//     console.debug('Mongoose default connection open to ' + dbURI);
// });

// If the connection throws an error
mongoose.connection.on("error", (err) => {
  console.error("Mongoose default connection error: " + err);
  sendLog(client, {
    embeds: [{
      title: "Mongoose default connection error: ",
      description: `\`\`\`\n${StringUtils.ellipsis((err ?? "").toString(), 4000)}\n\`\`\``,
      color: colors.error,
    }],
  });
});

// When the connection is disconnected
mongoose.connection.on("disconnected", () => {
  sendLog(client, {
    embeds: [{
      title: "Mongoose Event",
      description: "Mongoose default connection disconnected",
      color: colors.error,
    }],
  });
});

// If the Node process ends, close the Mongoose connection
process.on("SIGINT", () => {
  mongoose.connection.close().finally(() => {
    sendLog(client, "Mongoose default connection disconnected through app termination");
    process.exit(0);
  });
});

export const connection = mongoose.connection;
