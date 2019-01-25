import React from "react"
import { connect } from "react-redux"
import { withRouter } from 'react-router-dom'
import * as converters from "../../utils/converter"
import * as validators from "../../utils/validators"
import { TransferForm } from "../../components/Transaction"
import { TransactionLoading, QRCode, ChooseBalanceModal } from "../CommonElements"
import { AdvanceConfigLayout } from "../../components/TransactionCommon"
import { TokenSelector, AccountBalance } from "../TransactionCommon"
import { hideSelectToken } from "../../actions/utilActions"
import * as common from "../../utils/common"
import * as globalActions from "../../actions/globalActions"
import constansts from "../../services/constants"
import * as transferActions from "../../actions/transferActions"
import { getTranslate } from 'react-localize-redux'
import { default as _ } from 'underscore'
import BLOCKCHAIN_INFO from "../../../../env";
import * as web3Package from "../../services/web3"
import { importAccountMetamask } from "../../actions/accountActions"
import EthereumService from "../../services/ethereum/ethereum"

@connect((store, props) => {
  const langs = store.locale.languages
  var currentLang = common.getActiveLanguage(langs)
  const tokens = store.tokens.tokens
  const tokenSymbol = store.transfer.tokenSymbol
  const swapSrcTokenSymbol = store.exchange.sourceTokenSymbol;
  const swapDestTokenSymbol = store.exchange.destTokenSymbol;
  var balance = 0
  var decimals = 18
  var tokenName = "kyber"

  if (tokens[tokenSymbol]) {
    balance = tokens[tokenSymbol].balance
    decimals = tokens[tokenSymbol].decimals
    tokenName = tokens[tokenSymbol].name
  }

  return {
    transfer: { ...store.transfer, balance, decimals, tokenName },
    account: store.account,
    tokens: tokens,
    global: store.global,
    translate: getTranslate(store.locale),
    advanceLayout: props.advanceLayout,
    currentLang,
    swapSrcTokenSymbol,
    swapDestTokenSymbol,
    analytics: store.global.analytics
  }
})

class Transfer extends React.Component {
  constructor() {
    super()
    this.state = {
      focus: "transfer",
      defaultShowAmountErrorTooltip: true,
      defaultShowAddrErrorTooltip: true
    }
  }

  componentDidMount = () => {
    if (this.props.global.changeWalletType !== "") this.props.dispatch(globalActions.closeChangeWallet())

    // const web3Service = web3Package.newWeb3Instance();

    // if (web3Service !== false) {
    //   const walletType = web3Service.getWalletType();
    //   const isDapp = (walletType !== "metamask") && (walletType !== "modern_metamask");

    //   if (isDapp) {
    //     const ethereumService = this.props.ethereum ? this.props.ethereum : new EthereumService();

    //     this.props.dispatch(importAccountMetamask(web3Service, BLOCKCHAIN_INFO.networkId,
    //       ethereumService, this.props.tokens, this.props.translate, walletType))
    //   }
    // }
  }

  validateSourceAmount = (value, gasPrice) => {
    var checkNumber
    if (isNaN(parseFloat(value))) {
      // this.props.dispatch(transferActions.thowErrorAmount("error.amount_must_be_number"))
    } else {
      var amountBig = converters.stringEtherToBigNumber(this.props.transfer.amount, this.props.transfer.decimals)
      if (amountBig.isGreaterThan(this.props.transfer.balance)) {
        this.props.dispatch(transferActions.thowErrorAmount("error.amount_transfer_too_hign"))
        return
      }

      var testBalanceWithFee = validators.verifyBalanceForTransaction(this.props.tokens['ETH'].balance,
        this.props.transfer.tokenSymbol, this.props.transfer.amount, this.props.transfer.gas, gasPrice)
      if (testBalanceWithFee) {
        this.props.dispatch(transferActions.thowErrorEthBalance("error.eth_balance_not_enough_for_fee"))
      }
    }
  }

  dispatchEstimateGas = (value) => {
    this.props.dispatch(transferActions.estimateGasWhenAmountChange(value))
  }

  lazyUpdateValidateSourceAmount = _.debounce(this.validateSourceAmount, 500)
  lazyEstimateGas = _.debounce(this.dispatchEstimateGas, 500)

  onAddressReceiveChange = (event) => {
    var value = event.target.value
    this.props.dispatch(transferActions.specifyAddressReceive(value));
  }

  onAmountChange = (event) => {
    var value = event.target.value
    this.props.dispatch(transferActions.specifyAmountTransfer(value))
    if(this.props.account.account){
      this.lazyEstimateGas(value)
      this.lazyUpdateValidateSourceAmount(value, this.props.transfer.gasPrice)
    }
  }

  chooseToken = (symbol, address, type) => {
    this.props.dispatch(transferActions.selectToken(symbol, address))
    this.props.dispatch(hideSelectToken())

    var path = constansts.BASE_HOST + "/transfer/" + symbol.toLowerCase()

    path = common.getPath(path, constansts.LIST_PARAMS_SUPPORTED)

    this.props.dispatch(globalActions.goToRoute(path))
    this.props.analytics.callTrack("trackChooseToken", type, symbol);
  }

  makeNewTransfer = (changeTransactionType = false) => {
    this.props.dispatch(transferActions.makeNewTransfer());

    if (changeTransactionType) {
      var swapLink = constansts.BASE_HOST + "/swap/" + this.props.swapSrcTokenSymbol.toLowerCase() + "_" + this.props.swapDestTokenSymbol.toLowerCase();
      this.props.global.analytics.callTrack("trackClickNewTransaction", "Swap");
      this.props.history.push(swapLink)
    } else {
      this.props.global.analytics.callTrack("trackClickNewTransaction", "Transfer");
    }
  }

  onFocus = () => { 
    this.setState({focus:"source"})
    this.props.analytics.callTrack("trackClickInputAmount", "transfer");
  }

  onFocusAddr = () => { 
    this.setState({focus:"to-addr"})
    this.props.analytics.callTrack("trackClickInputRecieveAddress");
  }

  onBlur = () => {
    this.setState({ focus: "" })
  }

  setAmount = () => {
    var tokenSymbol = this.props.transfer.tokenSymbol
    var token = this.props.tokens[tokenSymbol]
    if (token) {
      var balanceBig = converters.stringToBigNumber(token.balance)
      if (tokenSymbol === "ETH") {
        var gasLimit = this.props.transfer.gas
        var gasPrice = converters.stringToBigNumber(converters.gweiToWei(this.props.transfer.gasPrice))
        var totalGas = gasPrice.multipliedBy(gasLimit)

        if (!balanceBig.isGreaterThanOrEqualTo(totalGas)) {
          return false
        }
        balanceBig = balanceBig.minus(totalGas)
      }
      var balance = balanceBig.div(Math.pow(10, token.decimals)).toString()
      balance = converters.toPrimitiveNumber(balance)
      this.props.dispatch(transferActions.specifyAmountTransfer(balance))

      this.onFocus()
    }
    this.props.analytics.callTrack("trackClickAllIn", "Transfer", tokenSymbol);
  }

  handleErrorQRCode = (err) =>{
  }

  handleScanQRCode = (data) =>{
    this.props.dispatch(transferActions.specifyAddressReceive(data));
  }


  toggleBalanceContent = () => {
    this.props.dispatch(transferActions.toggleBalanceContent())    
    if(!this.props.global.isOnMobile){
      this.props.dispatch(transferActions.toggleAdvanceContent())    
    }
  }
  toggleAdvanceContent = () => {
    this.props.dispatch(transferActions.toggleAdvanceContent())    
    if(!this.props.global.isOnMobile){
      this.props.dispatch(transferActions.toggleBalanceContent())    
    }
  }


  specifyGasPrice = (value) => {
    this.props.dispatch(transferActions.specifyGasPrice(value))

    if (this.props.account !== false && !this.props.isChangingWallet) {
      this.lazyUpdateValidateSourceAmount(this.props.transfer.amount, value)
    }
  }

  inputGasPriceHandler = (value) => {
    this.specifyGasPrice(value)
  }

  selectedGasHandler = (value, level) => {
    this.props.dispatch(transferActions.seSelectedGas(level))
    this.specifyGasPrice(value)
  }

  getAdvanceLayout = () => {
    return (
      <AdvanceConfigLayout
        selectedGas={this.props.transfer.selectedGas}
        selectedGasHandler={this.selectedGasHandler}
        gasPriceSuggest={this.props.transfer.gasPriceSuggest}
        translate={this.props.translate}
        isAdvanceActive = {this.props.transfer.isAdvanceActive}
        toggleAdvanceContent={this.toggleAdvanceContent}
        type="transfer"
      />
    )
  }

  getBalanceLayout = () => {
    return (
      <AccountBalance
        chooseToken={this.chooseToken}
        sourceActive={this.props.transfer.tokenSymbol}
        destTokenSymbol='ETH'
        onToggleBalanceContent={this.toggleBalanceContent}
        isBalanceActive = {this.props.transfer.isBalanceActive}
        tradeType = "transfer"
      />)
  }

  closeChangeWallet = () => {
    this.props.dispatch(globalActions.closeChangeWallet())
  } 

  acceptTerm = (e) => {
    this.props.dispatch(globalActions.acceptTermOfService())
  }


  getTransferBalance = () => {
    return (
      <ChooseBalanceModal
        changeAmount={transferActions.specifyAmountTransfer}
        changeFocus={this.onFocus}
        sourceTokenSymbol={this.props.transfer.tokenSymbol}
        typeTx={"transfer"}
      />
    )
  }
  
  setDefaulAmountErrorTooltip = (value) => {
    this.setState({defaultShowAmountErrorTooltip: value})
  }
  setDefaulAddrErrorTooltip = (value) => {
    this.setState({defaultShowAddrErrorTooltip: value})
  }

  render() {
    var addressBalance = ""
    var token = this.props.tokens[this.props.transfer.tokenSymbol]
    if (token) {
      addressBalance = {
        value: converters.toT(token.balance, token.decimals),
        roundingValue: converters.roundingNumber(converters.toT(token.balance, token.decimals)),
      }
    }

    var input = {
      destAddress: {
        value: this.props.transfer.destAddress,
        onChange: this.onAddressReceiveChange
      },
      amount: {
        value: this.props.transfer.amount,
        onChange: this.onAmountChange
      }
    }
    var errors = {
      destAddress: this.props.transfer.errors.destAddress || '',
      amountTransfer: this.props.transfer.errors.amountTransfer || this.props.transfer.errors.ethBalanceError || ''
    }

    var tokenTransferSelect = (
      <TokenSelector
        type="transfer"
        focusItem={this.props.transfer.tokenSymbol}
        listItem={this.props.tokens}
        chooseToken={this.chooseToken}
        banToken={BLOCKCHAIN_INFO.promo_token}
      />
    )

    var balanceInfo = {
      tokenName: this.props.transfer.balanceData.tokenName,
      amount: this.props.transfer.balanceData.amount,
      tokenSymbol: this.props.transfer.balanceData.tokenSymbol
    }
    var destAdressShort = this.props.transfer.destAddress.slice(0, 8) + "..." + this.props.transfer.destAddress.slice(-6)
    var transactionLoadingScreen = (
      <TransactionLoading
        tx={this.props.transfer.txHash}
        makeNewTransaction={this.makeNewTransfer}
        tempTx={this.props.transfer.tempTx}
        type="transfer"
        balanceInfo={balanceInfo}
        broadcasting={this.props.transfer.broadcasting}
        broadcastingError={this.props.transfer.bcError}
        address={destAdressShort}
        isOpen={this.props.transfer.step === 2}
      />
    )

    var qcCode = common.isMobile.any() ? <QRCode
      onError={this.handleErrorQRCode}
      onScan={this.handleScanQRCode}
      onDAPP={this.props.account.isOnDAPP}/> : ""

    return (
      <TransferForm
        account={this.props.account.account}
        chooseToken={this.chooseToken}
        sourceActive={this.props.transfer.tokenSymbol}
        step={this.props.transfer.step}
        tokenSymbol={this.props.transfer.tokenSymbol}
        tokenTransferSelect={tokenTransferSelect}
        transactionLoadingScreen={transactionLoadingScreen}
        input={input}
        errors={errors}
        translate={this.props.translate}
        onBlur={this.onBlur}
        onFocus={this.onFocus}
        focus={this.state.focus}
        onFocusAddr={this.onFocusAddr}
        advanceLayout={this.getAdvanceLayout()}
        balanceLayout={this.getBalanceLayout()}
        networkError={this.props.global.network_error}
        isChangingWallet = {this.props.global.isChangingWallet}
        changeWalletType = {this.props.global.changeWalletType}
        closeChangeWallet = {this.closeChangeWallet}
        global={this.props.global}
        addressBalance={addressBalance}
        walletName={this.props.account.walletName}
        qcCode = {qcCode}
        transferBalance = {this.getTransferBalance()}
        isAgreedTermOfService={this.props.global.termOfServiceAccepted}
        acceptTerm={this.acceptTerm}
        isBalanceActive = {this.props.transfer.isBalanceActive}
        isAdvanceActive = {this.props.transfer.isAdvanceActive}

        swapBalance = {this.getTransferBalance()}

        defaultShowAmountErrorTooltip = {this.state.defaultShowAmountErrorTooltip}
        setDefaulAmountErrorTooltip = {this.setDefaulAmountErrorTooltip}

        defaultShowAddrErrorTooltip = {this.state.defaultShowAddrErrorTooltip}
        setDefaulAddrErrorTooltip = {this.setDefaulAddrErrorTooltip}

      />
    )
  }
}

export default withRouter(Transfer)
