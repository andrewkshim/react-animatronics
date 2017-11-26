const makeRecorder = () => {
  const listeners = new Set();
  const recordings = {};

  const recorder = {

    record: ({ animationName, componentName, elapsedTime, updatedStyles, updateStyles }) => {
      if (!recordings[animationName]) {
        recordings[animationName] = {};
      }
      if (!recordings[animationName][componentName]) {
        recordings[animationName][componentName] = [];
      }
      recordings[animationName][componentName].push({
        animationName,
        componentName,
        elapsedTime,
        updatedStyles,
        updateStyles,
      });

      listeners.forEach(listener => {
        listener(recordings);
      });
    },

    addRecordListener: fn => {
      listeners.add(fn);
    },

    removeRecordListener: fn => {
      listeners.delete(fn);
    },

    reset: animationName => {
      recordings[animationName] = {};
    },

  };

  return recorder;
}

const Recorder = makeRecorder();

export default Recorder;
