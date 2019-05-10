const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { APP_SECRET, getUserId } = require("../utils");

function post(parent, args, context) {
  const userId = getUserId(context);
  return context.prisma.createLink({
    url: args.url,
    description: args.description,
    postedBy: { connect: { id: userId } }
  });
}
async function updateLink(parent, { id, ...data }, context, info) {
  const userId = getUserId(context);
  const linkExists = await context.prisma.$exists.link({
    postedBy: { id: userId }
  });
  if (!linkExists) {
    throw new Error(`Link not found ${id}`);
  }
  return context.prisma.updateLink({
    data,
    where: { id }
  });
}
async function deleteLink(parent, { id }, context) {
  const userId = getUserId(context);
  const linkExists = await context.prisma.$exists.link({
    postedBy: { id: userId }
  });
  if (!linkExists) {
    throw new Error(`Link not found ${id}`);
  }
  return context.prisma.deleteLink({ id });
}

async function signup(parent, args, context, info) {
  const password = await bcrypt.hash(args.password, 10);
  const user = await context.prisma.createUser({
    ...args,
    password
  });
  const token = jwt.sign({ userId: user.id }, APP_SECRET);

  return {
    token,
    user
  };
}

async function login(parent, args, context, info) {
  const user = await context.prisma.user({ email: args.email });
  if (!user) {
    throw new Error("No such user found!");
  }

  const valid = await bcrypt.compare(args.password, user.password);
  if (!valid) {
    throw new Error("Invalid password!");
  }

  const token = jwt.sign({ userId: user.id }, APP_SECRET);

  return {
    token,
    user
  };
}

async function vote(parent, args, context, info) {
  const userId = getUserId(context);

  const linkExists = await context.prisma.$exists.vote({
    user: { id: userId },
    link: { id: args.linkId }
  });
  if (linkExists) {
    throw new Error(`Already voted for link: ${args.linkId}`);
  }

  return context.prisma.createVote({
    user: { connect: { id: userId } },
    link: { connect: { id: args.linkId } }
  });
}

async function comment(parent, args, context, info) {
  const userId = getUserId(context);

  const linkExits = await context.prisma.$exists.link({ id: args.linkId });

  if (!linkExits) {
    throw new Error(`There's no link with this ID: ${args.linkId}`);
  }

  return context.prisma.createComment({
    postedBy: { connect: { id: userId } },
    link: { connect: { id: args.linkId } },
    body: args.body
  });
}

module.exports = {
  post,
  updateLink,
  deleteLink,
  signup,
  login,
  vote,
  comment
};
