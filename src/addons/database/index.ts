import mongoose from "mongoose";
import { colors, MONGODB_URI } from "../../config";
import { client } from "../../bot";
import { sendLog } from "../../core/logger";
import { StringUtils } from "../../core/utils/utils";
import "./models/Log";

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
  .catch((e) => {
    sendLog(client, {
      embeds: [{
        title: `[Shard ${client.shard?.ids.join(", ")}] Mongoose connection error`,
        description: `<t:${Math.floor(Date.now() / 1000)}:R>`,
        color: colors.error,
      }],
    });
    console.error(e);
  });

mongoose.connection.on("error", (err) => {
  console.error("Mongoose default connection error: " + err);
  sendLog(client, {
    embeds: [{
      title: `[Shard ${client.shard?.ids.join(", ")}] Mongoose default connection error: `,
      description: `\`\`\`\n${StringUtils.ellipsis((err ?? "").toString(), 4000)}\n\`\`\``,
      color: colors.error,
    }],
  });
});

mongoose.connection.on("disconnected", () => {
  sendLog(client, {
    embeds: [{
      title: `[Shard ${client.shard?.ids.join(", ")}]`,
      description: "Mongoose default connection disconnected",
      color: colors.error,
    }],
  });
});

export const connection = mongoose.connection;
