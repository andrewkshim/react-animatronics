import { makeAnimatronicsMachine } from './animatronics'
import { makeCountdownJobMachine } from './countdown-job'
import { makeEndlessJobMachine } from './endless-job'
import { makeSpringMachine } from './spring'
import { makeTimedJobMachine } from './timed-job'

export const makeMachinist = () => {
  const machinist = {};

  machinist.makeAnimatronicsMachine = makeAnimatronicsMachine(machinist);
  machinist.makeCountdownJobMachine = makeCountdownJobMachine(machinist);
  machinist.makeEndlessJobMachine = makeEndlessJobMachine(machinist);
  machinist.makeSpringMachine = makeSpringMachine(machinist);
  machinist.makeTimedJobMachine = makeTimedJobMachine(machinist);

  return machinist;
};
