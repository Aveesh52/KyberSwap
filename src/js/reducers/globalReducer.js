import constants from '../services/constants';
import * as common from '../utils/common'

const initState = {
  termOfServiceAccepted: false,
  isAcceptConnectWallet: false,
  showBalance: false,
  nodeName: "Infura Kovan",
  nodeURL: "https://kovan.infura.io/0BRKxQ0SFvAxGL72cbXi",
  // history: constants.HISTORY_EXCHANGE,
  count: { storageKey: constants.STORAGE_KEY },
  conn_checker: constants.CONNECTION_CHECKER,
  isVisitFirstTime: true,
  isOpenAnalyze: false,
  isAnalize: false,
  isAnalizeComplete: false,
  analizeError: {},
  selectedAnalyzeHash: '',
  changeWalletType: "",
  isChangingWallet: false,
  network_error: "",
  metamask: {
    address: "",
    balance: "",
    error: "Address is loading"
  },
  onMobile: {
    isIOS: false,
    isAndroid: false
  },
  isOnMobile: false,
  analytics: {
    callTrack: () => { return }
  },
  documentTitle: "Kyber Network | Instant Exchange | No Fees",
  theme: (() => {
    common.getCookie('theme')
  })()
}

const global = (state = initState, action) => {
  switch (action.type) {
    // case REHYDRATE: {
    //   if (action.key === "global") {
    //     if (action.payload){
    //       return {...state,
    //         count: {storageKey: constants.STORAGE_KEY}
    //        }
    //     }
    //   }
    //   return state
    // }
    // case "GLOBAL.NEW_BLOCK_INCLUDED_FULFILLED": {
    //   var history = { ...state.history }
    //   history.currentBlock = action.payload
    //   return Object.assign({}, state, { history: history })
    // }
    case "GLOBAL.TERM_OF_SERVICE_ACCEPTED": {
      return { ...state, termOfServiceAccepted: true }
    }
    case "GLOBAL.IDLE_MODE": {
      return { ...state, idleMode: true }
    }
    case "GLOBAL.EXIT_IDLE_MODE": {
      return { ...state, idleMode: false }
    }
    case "GLOBAL.TOGGLE_ANALYZE": {
      var oldStateOpenAnalyze = state.isOpenAnalyze
      return { ...state, isOpenAnalyze: !oldStateOpenAnalyze }
    }
    case "GLOBAL.OPEN_ANALYZE": {
      var txHash = action.payload
      var newState = { ...state }
      newState.selectedAnalyzeHash = txHash
      newState.isOpenAnalyze = true

      return newState
    }
    case "GLOBAL.SET_ANALYZE_ERROR": {
      const { networkIssues, reserveIssues, txHash } = action.payload
      var newState = { ...state }
      newState.analizeError[txHash] = { networkIssues, reserveIssues }
      newState.isAnalize = false
      newState.isAnalizeComplete = true
      return newState
    }

    // case "GLOBAL.UPDATE_HISTORY_EXCHANGE": {
    //   var history = { ...state.history }
    //   const { ethereum, page, itemPerPage, isAutoFetch } = action.payload
    //   if (!isAutoFetch) {
    //     history.isFetching = true
    //   }      
    //   return Object.assign({}, state, { history: history })
    //   break
    // }
    // case "GLOBAL.UPDATE_HISTORY": {
    //   const { logs, latestBlock, page, isAutoFetch } = action.payload
    //   var history = { ...state.history }

    //   if(logs) history.logs = logs      
    //   history.currentBlock = latestBlock
    //   history.page = page
    //   // history.eventsCount = eventsCount
    //   history.isFetching = false
    //   return { ...state,  history: {...history} }
    // }
    case "GLOBAL.CONNECTION_UPDATE_IS_CHECK": {
      var conn_checker = { ...state.conn_checker }
      conn_checker.isCheck = action.payload
      return Object.assign({}, state, { conn_checker: conn_checker })
    }
    case "GLOBAL.CONNECTION_UPDATE_COUNT": {
      var conn_checker = { ...state.conn_checker }
      conn_checker.count = action.payload
      return Object.assign({}, state, { conn_checker: conn_checker })
    }
    case "GLOBAL.SHOW_BALABCE_USD": {
      return Object.assign({}, state, { showBalance: true })
    }
    case "GLOBAL.HIDE_BALABCE_USD": {
      return Object.assign({}, state, { showBalance: false })
    }
    case "GLOBAL.VISIT_EXCHANGE": {
      return Object.assign({}, state, { isVisitFirstTime: false })
    }
    case "GLOBAL.THROW_ERROR_METAMASK": {
      const { err } = action.payload
      var metamask = { error: err }
      return Object.assign({}, state, { metamask: metamask })
    }
    case "GLOBAL.UPDATE_METAMASK_ACCOUNT": {
      const { address, balance } = action.payload
      const error = ""
      var metamask = { address, balance, error }
      return Object.assign({}, state, { metamask: metamask })
    }

    case "GLOBAL.SET_NOTI_HANDLER": {
      const { notiService } = action.payload
      return Object.assign({}, state, { notiService: notiService })
    }

    case "GLOBAL.SET_NETWORK_ERROR": {
      const { error } = action.payload
      return Object.assign({}, state, { network_error: error })
    }

    case "GLOBAL.CHANGE_WALLET": {
      const tradeType = action.payload
      return Object.assign({}, state, { changeWalletType: tradeType, isChangingWallet: true })
    }

    case "GLOBAL.CLOSE_CHANGE_WALLET": {
      return Object.assign({}, state, { changeWalletType: "", isChangingWallet: false })
    }

    case "GLOBAL.SET_ON_MOBILE": {
      const { isIOS, isAndroid } = action.payload
      let onMobile = {
        isIOS: isIOS,
        isAndroid: isAndroid
      }
      return Object.assign({}, state, { onMobile: onMobile })
    }
    case "GLOBAL.SET_ON_MOBILE_ONLY": {
      return Object.assign({}, state, { isOnMobile: true })
    }
    case "GLOBAL.INIT_ANALYTICS": {
      var newState = { ...state }
      newState.analytics = action.payload
      return newState
    }
    case "GLOBAL.SET_ACCEPT_CONNECT_WALLET": {
      return {
        ...state,
        isAcceptConnectWallet: action.payload
      }
    }
    case "GLOBAL.SET_DOCUMENT_TITLE": {
      return {
        ...state,
        documentTitle: action.payload
      }
    }
    case "GLOBAL.SWITCH_THEME": {
      return {
        ...state,
        theme: action.payload
      }
    }
  }
  return state
}

export default global
