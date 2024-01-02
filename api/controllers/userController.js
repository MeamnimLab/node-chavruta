const { UserModel } = require("../models/userModel");
const bcrypt = require("bcrypt");
const { validUser } = require("../validations/userValidation");
const { isDefaultImage } = require("../helpers/userHelper")
const { asyncHandler } = require("../helpers/wrap")

exports.userController = {
  myInfo: asyncHandler(async (req, res) => {
    // the middlware auth added the tokenData
    let userInfo = await UserModel.findOne({ _id: req.tokenData._id }, { password: 0 });
    if (!userInfo) {
      return res.status(404).json({ msg: "User not found" });
    }
    res.status(201).json({ data: userInfo, msg: "User information retrieved successfully" });
  }),
  userList: asyncHandler(async (req, res) => {
    let perPage = Math.min(req.query.perPage, 20) || 10;
    let page = req.query.page || 1;
    let sort = req.query.sort || "_id";
    let reverse = req.query.reverse == "yes" ? -1 : 1;

    // Fetch all users with all data
    let data = await UserModel
      .find({})
      .limit(perPage)
      .skip((page - 1) * perPage)
      .sort({ [sort]: reverse });

    if (!data || data.length === 0) {
      return res.status(404).json({ msg: "No users found" });
    }

    res.status(200).json({ data, msg: "ok" });
  }),
  searchName: asyncHandler(async (req, res) => {
    let perPage = Math.min(req.query.perPage, 20) || 10;
    let page = req.query.page || 1;
    let sort = req.query.sort || "_id";
    let reverse = req.query.reverse == "yes" ? -1 : 1;

    const searchQuery = req.params.name;

    // Define a regular expression for the search query (case-insensitive)
    const regex = new RegExp(searchQuery, "i");

    // Fetch users based on the search query
    let data = await UserModel
      .find({
        $or: [
          { firstName: regex },
          { lastName: regex },
        ],
      })
      .limit(perPage)
      .skip((page - 1) * perPage)
      .sort({ [sort]: reverse });
    if (!data || data.length === 0) {
      return res.status(404).json({ msg: "No users found" });
    }

    res.status(200).json({ data, msg: "ok" });
  }),
  profileList: asyncHandler(async (req, res) => {
    // need to add that will get only few images not everything

    // Fetch distinct _id, profilePic, firstName, and lastName values for all users excluding passwords
    let data = await UserModel
      .find({ profilePic: { $exists: true, $ne: null } })
      .select("_id profilePic firstName lastName");

    // Filter out users with default profile pictures
    const profilesList = data.filter(user => !isDefaultImage(user.profilePic));

    res.status(200).json({ data: profilesList, msg: "ok" });
  }),


  singleUser: async (req, res) => {
    try {
      let idSingle = req.params.idSingle1;
      let data = await UserModel.findOne({ _id: idSingle });

      console.log(data);

      if (data === null) {
        res.status(404).json({ msg: "No item found" });
      } else {
        res.status(200).json({ data, msg: "ok" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Internal server error", err: err.message });
    }
  },
  editUser: async (req, res) => {
    let validBody = validUser(req.body);
    if (validBody.error) {
      return res.status(400).json(validBody.error.details);
    }
    try {
      let idEdit = req.params.idEdit;
      let data;
      if (req.tokenData.role === "admin") {
        data = await UserModel.updateOne({ _id: idEdit }, req.body)
      }
      else if (idEdit === req.tokenData._id) {
        data = await UserModel.updateOne({ _id: idEdit }, req.body)
      }
      if (!data) {
        return res.status(400).json({ err: "This operation is not enabled !" })
      }
      let user = await UserModel.findOne({ _id: idEdit });
      user.password = await bcrypt.hash(user.password, 10);
      await user.save()
      res.status(200).json({ msg: data })
    }
    catch (err) {
      console.log(err);
      res.status(400).json({ err })
    }
  },
  deleteAccount: async (req, res) => {
    try {
      if (req.tokenData.role === "admin") {
        return res.status(400).json("can't delete an admin user");
      }
      else {
        let data = await UserModel.deleteOne({ _id: req.tokenData._id })
        res.status(201).json(data);
      }
    }
    catch (err) {
      console.log(err);
      res.status(500).json({ msg: "err to delete your account", err })
    }
  },
  deleteUser: async (req, res) => {
    try {
      let delId = req.params.idDel;
      let data = await UserModel.deleteOne({ _id: delId });
      res.status(201).json(data);
    }
    catch (err) {
      console.log(err);
      res.status(500).json({ msg: "err to delete this user by id", err })
    }
  }

}