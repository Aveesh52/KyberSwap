import React from "react"
import { connect } from "react-redux"
import { getWallet } from "../../services/keys"
import * as actions from '../../actions/accountActions'

@connect((store) => {
  return { ethereum: store.connection.ethereum }
})
export default class ImportByTorus extends React.Component {
  async connect() {
    const walletType = "torus";
    const wallet = getWallet(walletType);
    
    try {
      const address = await wallet.getAddress();
      this.props.closeParentModal();
      
      this.props.dispatch(actions.importNewAccount(
        address.toLowerCase(),
        walletType,
        null,
        this.props.ethereum,
        null,
        null,
        "Wallet Link"
      ))
    } catch (err) {
      console.log(err);
      this.props.dispatch(actions.throwError(err))
    }
  }
  
  render() {
    return (
      <div className="import-account__block theme__import-button" onClick={() => this.connect()}>
        <div className="import-account__icon torus"/>
        <div className="import-account__name">Torus</div>
      </div>
    )
  }
}
