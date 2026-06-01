/** Cancel Activity command */
export const CANCEL_ACTIVITY_ACTIVITY_NOT_FOUND = 'cancel-activity-activity-not-found'
export const CANCEL_ACTIVITY_ACTIVITY_WITH_PARTICIPANTS_CANNOT_BE_CANCELLED =
  'cancel-activity-activity-with-participants-cannot-be-cancelled'
export const CANCEL_ACTIVITY_ACTIVITY_STATUS_DOES_NOT_ALLOW_CANCEL = 'cancel-activity-activity-status-does-not-allow-cancel'
export const CANCEL_ACTIVITY_ONLY_HOST_CAN_CANCEL_ACTIVITY = 'cancel-activity-only-host-can-cancel-activity'

/** Create Activity command */
export const CREATE_ACTIVITY_INVALID_INPUT = 'create-activity-invalid-input'
export const CREATE_ACTIVITY_INVALID_SPORT_ID = 'create-activity-invalid-sport-id'
export const CREATE_ACTIVITY_SPORT_NOT_FOUND = 'create-activity-sport-not-found'

/** Get Activities query */
export const GET_ACTIVITIES_INVALID_PARAMS = 'get-activities-invalid-params'

/** Get User Activities query */
export const GET_USER_ACTIVITIES_INVALID_PARAMS = 'get-user-activities-invalid-params'

/** Get Activity query */
export const GET_ACTIVITY_ACTIVITY_NOT_FOUND = 'get-activity-activity-not-found'

/** Join Activity command */
export const JOIN_ACTIVITY_ACTIVITY_ALREADY_FULL = 'join-activity-activity-already-full'
export const JOIN_ACTIVITY_ACTIVITY_ALREADY_STARTED = 'join-activity-activity-already-started'
export const JOIN_ACTIVITY_ACTIVITY_NOT_AVAILABLE_TO_JOIN = 'join-activity-activity-not-available-to-join'
export const JOIN_ACTIVITY_ACTIVITY_NOT_FOUND = 'join-activity-activity-not-found'
export const JOIN_ACTIVITY_ACTIVITY_STATUS_DOES_NOT_ALLOW_JOIN = 'join-activity-activity-status-does-not-allow-join'
export const JOIN_ACTIVITY_USER_ALREADY_JOINED = 'join-activity-user-already-joined'

/** Leave Activity command */
export const LEAVE_ACTIVITY_ACTIVITY_ALREADY_CONFIRMED_TO_TAKE_PLACE = 'leave-activity-activity-already-confirmed-to-take-place'
export const LEAVE_ACTIVITY_ACTIVITY_LEAVE_DEADLINE_ALREADY_PASSED = 'leave-activity-activity-leave-deadline-already-passed'
export const LEAVE_ACTIVITY_ACTIVITY_NOT_FOUND = 'leave-activity-activity-not-found'
export const LEAVE_ACTIVITY_ACTIVITY_STATUS_DOES_NOT_ALLOW_LEAVE = 'leave-activity-activity-status-does-not-allow-leave'
export const LEAVE_ACTIVITY_USER_IS_NOT_A_PARTICIPANT = 'leave-activity-user-is-not-a-participant'
