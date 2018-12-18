const mongoose = require('mongoose')
const Joi = require('joi')
const jwt = require('jsonwebtoken')
const config = require('config')
const { Navigation } = require('@models/navigations')

const Schema = new mongoose.Schema({
  username: {
    type: String,
    minlength: 6,
    maxlength: 255,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return (v.includes('@')) ? false : true
      },
      message: 'username should not contain \'@\' character'
    }
  },
  password: {
    type: String,
    maxlength: 1024,
    trim: true
  },
  email: {
    type: String,
    match: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    unique: true,
    lowercase: true,
    trim: true
  },
  profile: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile'
  },
  navigation: Array,
  lastLogin: Date,
  groups: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Group' } ],
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role'
  }
})

Schema.methods.generateAuthToken = function() {
  const token = jwt.sign({ _id: this._id, email: this.email }, config.get('jwtPrivateKey'))
  return token
}

Schema.methods.getNavigation = async function() {
  const ownedNavigation = await Navigation.find({ groupsPrivilege: {$in: this.groups }}).select('-groupsPrivilege -rolesPrivilege')
  return ownedNavigation
}

const User = mongoose.model('User', Schema)

const joiSchema = {
  username: Joi.string().min(6).max(30).regex(/@/, { name: 'valid username', invert: true }).required(),
  email: Joi.string().email().regex(/@/, { name: 'valid email', invert: false }).required(),
  password: Joi.string().min(8).max(100).required(),
  profile: Joi.string().optional()
}

exports.User = User
exports.joiSchema_User = joiSchema