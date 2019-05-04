const jwt = require("jsonwebtoken");
const APP_SECRET = "Blog-using-GraphQL-aw3some";

function getUserId(context) {
  const Authorization = context.request.get("Authorization");
  console.log("Authorization", Authorization);
  if (Authorization) {
    const token = Authorization.replace("Bearer ", "");
    const { userId } = jwt.verify(token, APP_SECRET);
    return userId;
  }
  throw new Error("Not Authenticated!");
}

module.exports = {
  APP_SECRET,
  getUserId
};
