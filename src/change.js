import { registerReducer, dispatchStoreAction } from './slimRedux';

/**
 * Executes and / or registers a change to the store (this replaces actions and reducers)
 * @param {object} parameters - Object with parameters for this change operation. The only parameter that is really needed is the modifier function.
 * @param {string} [parameters.actionType = null] - Type for the action this change triggers & processes (this could also be an existing action type which means that you can use change handlers to register store reducer logic for existing actions)
 * @param {object} [parameters.payload = {}] - Payload for the actions this change triggers. This only makes sense when upon registering this change handler should also be fired and an elsewhere defined function is used as the change's modifier parameter.
 * @param {change~modifier} parameters.reducer - Handler for this change which is equivalent to the reducer logic
 * @param {bool} [parameters.registerOnly = false] - Flag which can be set to only register this change handler and not execute it
 * @param {change~payloadValidation} parameters.payloadValidation - Validation function which returns true / false based depending on whether or not the payload is valid. If this returns false, slimRedux automatically dispatches an error action according to FSA (Flux Standard Action) format. This can only be used in non-anonymous changes.

 */
export function change(parameters){
  var actionType        = parameters.actionType || null,
      payload           = parameters.payload || {},
      reducer           = parameters.reducer,
      registerOnly      = parameters.registerOnly || false,
      payloadValidation = parameters.payloadValidation;

  if(actionType){
    // This change has an ACTION_TYPE, which means we can register it in the reducer
    registerReducer(actionType, payload, reducer, payloadValidation);

    if(!registerOnly){
      // TODO: Enable validation!

      dispatchStoreAction({
        type: actionType,
        payload: payload,
      });
    }

    // Create and return change trigger function (has payload as the only parameter, will trigger validation)
    return (actionPayload) => {
      // TODO: Enable validation!
      dispatchStoreAction({
        type: actionType,
        payload: actionPayload,
      });
    }
  } else {
    // Anonymous change (no ACTION_TYPE) - don't register, just dispatch the appropriate action!
    return (actionPayload) => {
      dispatchStoreAction({
        type: '__ANONYMOUS_CHANGE__',
        payload: {
          '__slimReduxChange__': {
            reducer,
            payload,
          }
        }
      });
    }
  }
}

/**
 * Callback which essentially contains the reducer logic for a change. When this function is called, the immutable.js library is made available in its scope to provide useful tools for immutable state modifications.
 * @callback change~modifier
 * @param {object} state - The contents of the store
 * @param {object} payload - The payload of the action that is triggering this modifier function being called by the slimRedux reducer
 * @param {object} [action] - The action which has triggered this modifier function to be called up by the slimRedux reducer
 * @returns {object} The new state
 */

 /**
  * Callback which can be used to validte the payload that gets passed in for this change handler
  * @callback change~payloadValidation
  * @param {object} payload - The payload passed in for this change
  * @returns {boolean} True if the payload is valid, false if not
  */