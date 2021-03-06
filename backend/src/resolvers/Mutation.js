const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomBytes } = require('crypto');
const { promisify } = require('util');

const Mutations = {
  async createItem(parent, args, ctx, info) {
    // TODO: Check if they are logged in

    const item = await ctx.db.mutation.createItem(
      {
        data: {
          ...args
        }
      },
      info
    );

    console.log(item);

    return item;
  },
  updateItem(parent, args, ctx, info) {
    // first take a copy of the updates
    const updates = { ...args };
    // remove the ID from the updates
    delete updates.id;
    // run the update method
    return ctx.db.mutation.updateItem(
      {
        data: updates,
        where: {
          id: args.id
        }
      },
      info
    );
  },
  async deleteItem(parent, args, ctx, info) {
    const where = { id: args.id };
    // 1. find the item
    const item = await ctx.db.query.item({ where }, `{ id title}`);
    // 2. Check if they own that item, or have the permissions
    // TODO
    // 3. Delete it!
    return ctx.db.mutation.deleteItem({ where }, info);
  },
  async signup(parent, args, ctx, info) {
    //make their email lowercase
    args.email = args.email.toLowerCase();
    // hash their password
    const password = await bcrypt.hash(args.password, 10);
    const user = await ctx.db.mutation.createUser(
      {
        data: {
          ...args,
          password,
          permissions: { set: ["USER"] }
        }
      },
      info
    );
    //create jwt token for them
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    //set the jwt as a cookie on the response
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365 // 1 year cookie
    });
    //return the user to the browser
    return user;
  },
  async signin(parent, { email, password }, ctx, info) {
    //check if there is a user with that email
    const user = await ctx.db.query.user({ where: { email } });
    if (!user) {
      throw new Error(`No such user found for email ${email}`);
    }
    //check if their password is correct
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new Error("Invalid Password!");
    }
    //generate the jwt token
    const token = jwt.sign({ userId: user.id }, process.env.APP_SECRET);
    //set the cooke with the token
    ctx.response.cookie("token", token, {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 365
    });
    //return the user
    return user;
  },
  signout(parent, args, ctx, info) {
    ctx.response.clearCookie("token");
    return { message: "Thank you come again!" };
  },
  async requestReset(parent, args, ctx, info) {
    //check if this is a real user
    const user = await ctx.db.query.user({ where: { email: args.email } });
    if (!user) {
        throw new Error(`No such user found for email ${args.email}`);
    }
    //set a reset token and expiry on that user
    const randomBytesPromisified = promisify(randomBytes);
    const resetToken = (await randomBytesPromisified(20)).toString('hex')
    const resetTokenExpiry = Date.now() + 3600000; //1 hour from now
    const res = await ctx.db.mutation.updateUser({
        where: { email: args.email },
        data: { resetToken, resetTokenExpiry }
    });
    return { message: 'Thanks!' };
    //email them the reset token
  },
  async resetPassword(parent, args, ctx, info) {
      //check if passwords match
      if (args.password !== args.confirmPassword) {
          throw new Error('Hey! Your passwords don\'t match try again!');
      }
      //check if reset token is legit
      //check if expired
      const [user] = await ctx.db.query.users({
          where: {
              resetToken: args.resetToken,
              resetTokenExpiry_gte: Date.now() - 3600000,
          },
      });
      if (!user) {
          throw new Error('This token is either invalid or expired!');
      }
      //hash their new password
      const password = await bcrypt.hash(args.password, 10);
      //save the new password to the user and remove old reset token fields
      const updatedUser = await ctx.db.mutation.updateUser({
          where: { email: user.email },
          data: {
              password,
              resetToken: null,
              resetTokenExpiry: null,
          },
      });
      //generate jwt
      const token = jwt.sign({ userID: updatedUser.id },
        process.env.APP_SECRET);
      //set the jwt cookie
      ctx.response.cookie('token', token, {
          httpOnly: true,
          maxAge: 1000 * 60 * 60 * 24 * 365
      })
      //return the new user
      return updatedUser;
      //that was alot
  },
};

module.exports = Mutations;