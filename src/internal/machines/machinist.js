import { makeAnimatronicsMachine } from './animatronics-machine'
import { makeCountdownJobMachine } from './countdown-job-machine'
import { makeEndlessJobMachine } from './endless-job-machine'
import { makeSpringMachine } from './spring-machine'
import { makeTimedJobMachine } from './timed-job-machine'

export const makeMachinist = () => {
  const machinist = {};

  machinist.makeAnimatronicsMachine = makeAnimatronicsMachine(machinist);
  machinist.makeCountdownJobMachine = makeCountdownJobMachine(machinist);
  machinist.makeEndlessJobMachine = makeEndlessJobMachine(machinist);
  machinist.makeSpringMachine = makeSpringMachine(machinist);
  machinist.makeTimedJobMachine = makeTimedJobMachine(machinist);

  return machinist;
};
