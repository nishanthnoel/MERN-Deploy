const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    password: { type: Buffer, required: true },
    role: { type: String, required: true, default: "user" },
    addresses: { type: [Schema.Types.Mixed] },
    //for addresses we can create another schema later. but the requirement is small so we are using mixed type
    name: { type: String },
    orders: { type: [Schema.Types.Mixed] },
    salt: { type: Buffer, required: true },
    resetPasswordToken: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

const virtual = userSchema.virtual("id");
virtual.get(function () {
  return this._id;
});
userSchema.set("toJSON", {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  },
});

exports.User = mongoose.model("User", userSchema);
