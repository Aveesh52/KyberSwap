import React from "react";
import {
  ImportKeystore,
  ImportByDevice,
  ImportByPrivateKey,
  ImportByMetamask,
  ImportByDeviceWithLedger,
  ImportByDeviceWithTrezor,
  ImportByPromoCode,
  ImportByWalletConnect
} from "../../containers/ImportAccount";

const ImportAccountView = (props) => {
  var isOnMobile = props.onMobile.isIOS || props.onMobile.isAndroid;
  const { isIOS: isIos, isAndroid } = props.onMobile;

  const importInactiveClass = !props.isAgreedTermOfService ? 'import-account__item--inactive' : '';

  return (
    <div className="import-account">
      <div className="import-account__choose-wallet-container container">
        {props.isAgreedTermOfService && (
          <h1 className="import-account__title">{props.tradeType === "swap" ?
            props.translate("address.connect_your_wallet_to_swap") || "Connect your Wallet to Swap" :
            props.translate("address.connect_your_wallet_to_transfer") || "Connect your Wallet to Transfer"}
          </h1>
        )}

        {!props.isAgreedTermOfService && (
          <div className="import-account__title--inactive">
            <div className="import-account__title--inactive--seperator"></div>
            <div className="import-account__title--inactive--content">
              {props.translate("address.or_connect_with") || "Or Connect with"}
            </div>
          </div>
        )}

        <div className={`import-account__content ${props.isAcceptConnectWallet ? "import-account__content--animation" : ""} ${isOnMobile ? ' import-account__content--mobile' : ''}`}>
          {!isOnMobile &&
            <div className={`import-account__item ${importInactiveClass}`}>
              <ImportByMetamask />
            </div>
          }

          {!isOnMobile &&
            <div className={`import-account__item import-account__item-trezor ${importInactiveClass}`}>
              <ImportByDeviceWithTrezor />
            </div>
          }

          {!isOnMobile &&
            <div className={`import-account__item import-account__item-ledger ${importInactiveClass}`}>
              <ImportByDeviceWithLedger />
            </div>
          }

          {!isOnMobile &&
            <div className={`import-account__item ${importInactiveClass}`}>
              <ImportKeystore />
            </div>
          }

          {isOnMobile &&
            <div className="import-account__item download-app">
              <div className={"import-account__block"}>
                <div className={"import-account__block-left"}>
                  <div className="import-account__icon kyberapp" />
                  <div>
                    <div className="import-account__name">KYBERSWAP APP</div>
                    <div className="import-account__desc">Ethereum Wallet & DApp</div>
                  </div>
                </div>
                {isIos && <a
                  className="import-account__block-right import-account__block-right--download"
                  href={"https://itunes.apple.com/us/app/kyberswap/id1453691309?ls=1&mt=8"}
                  target="_blank"
                >
                  {props.translate("address.download") || "Download"}
                </a>}
                {isAndroid && <a
                  className="import-account__block-right import-account__block-right--comming-soon"
                  href={""}
                  target="_blank"
                >
                  {props.translate("address.register_beta") || "Comming soon"}
                </a>}
              </div>
            </div>
          }

          <div className={`import-account__item ${importInactiveClass}`}>
            <ImportByPrivateKey isOnMobile={isOnMobile} />
          </div>

          <div className={`import-account__item ${importInactiveClass}`}>
            <ImportByPromoCode isOnMobile={isOnMobile} />
          </div>

          <div className={`import-account__item ${importInactiveClass}`}>
            <ImportByWalletConnect isOnMobile={isOnMobile} />
          </div>

        </div>
      </div>
      {props.errorModal}
    </div>
  )
}

export default ImportAccountView
