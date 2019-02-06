import * as utils from './index';

export const Groups = {
  likes_premium: 'likes_premium'
};

export const GroupsData = {
  [Groups.likes_premium]: {
    groupsCount: 2
  }
};

export function group(userId, groupName) {
  const data = GroupsData[groupName];
  if (!data) {
    return 0;
  }
  return parseInt(userId, 10) % (data.groupsCount + 1);
}

export function statEvent(userId, groupName, action) {
  const groupId = group(userId, groupName);
  if (!groupId) {
    return;
  }
  utils.statReachGoal(`ab_${groupName}_${groupId}_${action}`);
}
