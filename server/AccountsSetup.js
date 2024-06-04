import { Accounts } from 'meteor/accounts-base';
import { Roles } from 'meteor/alanning:roles';

Accounts.onCreateUser((options, user) => {
  user.roles = [];

  // Assign roles based on the username
  if (options.username === "Admin") {
    user.roles.push('admin');
  } else {
    user.roles.push('user');
  }

  // Include profile information
  if (options.profile) {
    user.profile = options.profile;
  }

  return user;
});

Meteor.publish(null, function () {
  if (this.userId) {
    return Meteor.roleAssignment.find({ 'user._id': this.userId });
  } else {
    this.ready();
  }
});
