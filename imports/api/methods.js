import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Sessions } from './Sessions';
import { Bookings } from './Bookings';
import { Roles } from 'meteor/alanning:roles';

Meteor.methods({
  'bookings.getPending'() {
    return Bookings.find({ status: 'Awaiting Confirmation' }).fetch();
  },
  'sessions.getSession'({ sessionId }) {
    check(sessionId, String);
    return Sessions.findOne(sessionId);
  },
  'sessions.create'({ sportName, coachId, roomId, date, time, slots, fee }) {
    check(sportName, String);
    check(coachId, String);
    check(roomId, String);
    check(date, String);
    check(time, String);
    check(slots, Number);
    check(fee, Number);

    Sessions.insert({
      sportName,
      coachId,
      roomId,
      date,
      time,
      slots: parseInt(slots, 10),
      fee: parseFloat(fee),
      createdAt: new Date(),
    });
  },

  'sessions.book'({ sessionId, userId, firstName, lastName, gender, phoneNumber, paymentMethod, confirmationCode }) {
    check(sessionId, String);
    check(userId, String);
    check(firstName, String);
    check(lastName, String);
    check(gender, String);
    check(phoneNumber, String);
    check(paymentMethod, String);
    if (paymentMethod === 'paybill') {
      check(confirmationCode, String);
    }

    const session = Sessions.findOne(sessionId);
    if (!session) {
      throw new Meteor.Error('Session not found', 'The session does not exist');
    }

    if (session.slots <= 0) {
      throw new Meteor.Error('Session full', 'No more slots available for this session');
    }

    let status = 'Paid';
    if (paymentMethod === 'paybill') {
      status = 'Awaiting Confirmation';
    }

    Sessions.update(sessionId, { $inc: { slots: -1 } });

    Bookings.insert({
      sessionId,
      userId,
      firstName,
      lastName,
      gender,
      phoneNumber,
      paymentMethod,
      confirmationCode,
      status,
      bookedAt: new Date(),
    });

    if (paymentMethod === 'wallet') {
      const admin = Accounts.findUserByUsername('Admin');
      if (admin) {
        Meteor.users.update(admin._id, {
          $inc: { 'profile.walletBalance': session.fee }
        });
      }
      Meteor.users.update(userId, {
        $inc: { 'profile.walletBalance': -session.fee }
      });
    }
  },

  'sessions.edit'({ sessionId, updates }) {
    check(sessionId, String);
    check(updates, Object);
    
    if (updates.slots) {
      updates.slots = parseInt(updates.slots, 10);
    }
    if (updates.fee) {
      updates.fee = parseFloat(updates.fee);
    }
    Sessions.update(sessionId, { $set: updates });
  },

  'sessions.delete'({ sessionId }) {
    check(sessionId, String);

    Sessions.remove(sessionId);
    Bookings.remove({ sessionId });
  },

  'sessions.unbookRequest'({ bookingId, sessionId }) {
    check(bookingId, String);
    check(sessionId, String);

    Bookings.update(bookingId, { $set: { status: 'Awaiting Approval for Unbooking' } });
  },

  'approveUnbooking'({ bookingId }) {
    check(bookingId, String);

    const booking = Bookings.findOne(bookingId);
    if (!booking) {
      throw new Meteor.Error('Booking not found', 'The booking does not exist');
    }

    const sessionId = booking.sessionId;
    Sessions.update(sessionId, { $inc: { slots: 1 } });
    Bookings.update(bookingId, { $set: { status: 'Unbooked' } });

    const user = Meteor.users.findOne({ _id: booking.userId });
    const session = Sessions.findOne({ _id: sessionId });
    if (user && session) {
      Meteor.users.update(user._id, { $inc: { 'profile.walletBalance': session.fee } });
      const admin = Accounts.findUserByUsername('Admin');
      if (admin) {
        Meteor.users.update(admin._id, { $inc: { 'profile.walletBalance': -session.fee } });
      }
    }
  },

  'rejectUnbooking'({ bookingId }) {
    check(bookingId, String);

    Bookings.update(bookingId, { $set: { status: 'Paid' } });
  },

  'approvePayment'({ bookingId }) {
    check(bookingId, String);

    const booking = Bookings.findOne(bookingId);
    if (!booking) {
      throw new Meteor.Error('Booking not found', 'The booking does not exist');
    }

    Bookings.update(bookingId, { $set: { status: 'Paid' } });

    const session = Sessions.findOne({ _id: booking.sessionId });
    const admin = Accounts.findUserByUsername('Admin');
    if (admin && session) {
      Meteor.users.update(admin._id, {
        $inc: { 'profile.walletBalance': session.fee }
      });
    }
  },

  'rejectPayment'({ bookingId }) {
    check(bookingId, String);

    const booking = Bookings.findOne(bookingId);
    if (!booking) {
      throw new Meteor.Error('Booking not found', 'The booking does not exist');
    }

    Sessions.update(booking.sessionId, { $inc: { slots: 1 } });
    Bookings.remove(bookingId);
  },

  'coaches.create'({ fullName, age, gender, contactNumber, speciality }) {
    check(fullName, String);
    check(age, Number);
    check(gender, String);
    check(contactNumber, String);
    check(speciality, String);

    Coaches.insert({
      fullName,
      age: parseInt(age, 10),
      gender,
      contactNumber,
      speciality,
      createdAt: new Date(),
    });
  },

  'coaches.edit'({ coachId, updates }) {
    check(coachId, String);
    check(updates, Object);

    if (updates.age) {
      updates.age = parseInt(updates.age, 10);
    }
    Coaches.update(coachId, { $set: updates });
  },

  'coaches.delete'({ coachId }) {
    check(coachId, String);

    Coaches.remove(coachId);
  },

  'rooms.create'({ name, capacity }) {
    check(name, String);
    check(capacity, Number);

    Rooms.insert({
      name,
      capacity: parseInt(capacity, 10),
      createdAt: new Date(),
    });
  },

  'rooms.edit'({ roomId, updates }) {
    check(roomId, String);
    check(updates, Object);

    if (updates.capacity) {
      updates.capacity = parseInt(updates.capacity, 10);
    }
    Rooms.update(roomId, { $set: updates });
  },

  'rooms.delete'({ roomId }) {
    check(roomId, String);

    Rooms.remove(roomId);
  },

  'user.updateProfile'(profile) {
    check(profile, {
      firstName: String,
      lastName: String,
      contactNumber: String,
      preferences: String,
      email: String,
    });

    if (!this.userId) {
      throw new Meteor.Error('Not authorized');
    }

    Meteor.users.update(this.userId, {
      $set: {
        'profile.firstName': profile.firstName,
        'profile.lastName': profile.lastName,
        'profile.contactNumber': profile.contactNumber,
        'profile.preferences': profile.preferences,
        'profile.email': profile.email,
      }
    });
  },

  'user.uploadProfilePicture'(fileData) {
    check(fileData, String);

    if (!this.userId) {
      throw new Meteor.Error('Not authorized');
    }

    Meteor.users.update(this.userId, {
      $set: {
        'profile.picture': fileData,
      }
    });
  },

  'wallet.deposit'(amount) {
    check(amount, Number);

    if (!this.userId) {
      throw new Meteor.Error('Not authorized');
    }

    Meteor.users.update(this.userId, {
      $inc: {
        'profile.walletBalance': amount,
      }
    });
  },

  'wallet.withdraw'(amount) {
    check(amount, Number);

    if (!this.userId) {
      throw new Meteor.Error('Not authorized');
    }

    const user = Meteor.users.findOne(this.userId);
    if (user.profile.walletBalance < amount) {
      throw new Meteor.Error('Insufficient funds', 'Not enough balance in wallet');
    }

    Meteor.users.update(this.userId, {
      $inc: {
        'profile.walletBalance': -amount,
      }
    });
  }
});
