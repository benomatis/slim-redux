import { createStore } from 'redux';
import reduceReducers from 'reduce-reducers';


function slimReduxReducer(state, action){
  const actionType = action.type,
        payload    = action.payload,
        store      = this,
        reducer    = (store.slimRedux.changeTriggers[actionType] ? store.slimRedux.changeTriggers[actionType].reducer : null);

  if(reducer)
    return reducer(state, payload, action);
  else
    return state;
}


function performPayloadValidation(actionType, actionPayload) {
  const accept    = function() { return {type: 'accept'} },
        reject    = function(msg = '') { return {type: 'reject', payload: msg} },
        store     = this,
        validator = store.slimRedux.changeTriggers[actionType].payloadValidation;

  // If payloadValidation() function was registered for this change trigger: Perform validation, otherwise just return 'accept'
  if(validator)
    return validator(actionPayload, accept, reject);
  else
    return {type: 'accept'}
}


// Creates the change triggers (is bound to the redux store instance with initSlimRedux())
function createChangeTrigger(parameters) {
  const actionType        = parameters.actionType,
        reducer           = parameters.reducer,
        payloadValidation = parameters.payloadValidation || null,
        store             = this;

  // TODO: Insert parameters validation here! (to ensure correct usage of createChangeTrigger())
  store.slimRedux.changeTriggers[actionType] = {reducer, payloadValidation};

  // Return the change trigger function which is bound to the store instance as well
  return (actionPayload) => {
    const store      = this,
          validation = store.performPayloadValidation(actionType, actionPayload);

    if(validation.type === 'accept'){
      // If payload validation was successful, dispatch the action to the reducers
      store.dispatch({
        type: actionType,
        payload: actionPayload,
      });

      return validation;
    } else {
      // If payload validation was not successful: Trigger error action!
      store.dispatch({
        type: actionType,
        error: true,
        payload: validation.payload,
      });

      return validation;
    }
  }
}


export function createSlimReduxStore(existingRootReducer, initialState, enhancer) {
  var store = createStore(existingRootReducer, initialState, enhancer);

  // Inject slimRedux related stuff into the store
  store.createChangeTrigger      = createChangeTrigger;
  store.performPayloadValidation = performPayloadValidation;
  store.slimReduxReducer         = slimReduxReducer;
  // Stores registered change handlers and later centralized input validation and error handling functions
  store.slimRedux                = { changeTriggers: {} };

  // Inject the slimReduxReducer into the store
  const enhancedRootReducer = reduceReducers(existingRootReducer, (state, action) => {
    return store.slimReduxReducer(state, action);
  });
  store.replaceReducer(enhancedRootReducer);

  return store;
}
