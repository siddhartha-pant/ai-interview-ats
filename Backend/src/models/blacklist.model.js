const mongoose = require("mongoose");

const blacklistTokenSchema = new mongoose.Schema({
  token: {
    type: String,
    required: [true, "Token is required to be added in blacklist"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // auto-delete after 1 day — matches JWT expiry
  },
});

const tokenBlacklistModel = mongoose.model(
  "blacklistTokens",
  blacklistTokenSchema,
);

module.exports = tokenBlacklistModel;
