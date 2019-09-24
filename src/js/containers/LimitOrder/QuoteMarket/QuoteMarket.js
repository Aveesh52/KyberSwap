import React from "react"
import * as common from "../../../utils/common"
import * as converter from "../../../utils/converter"
import { connect } from "react-redux"
import * as limitOrderActions from "../../../actions/limitOrderActions"
import { SortableComponent } from "../../../components/CommonElement"
import limitOrderServices from "../../../services/limit_order";
import { QuoteList, Search } from "../QuoteMarket"
import { sortQuotePriority } from "../../../utils/sorters";

@connect((store, props) => {
  const tokens = store.tokens.tokens
  const currentQuote = store.limitOrder.currentQuote
  return {
    tokens, currentQuote, global: store.global
  }
})
export default class QuoteMarket extends React.Component{
  constructor() {
    super()
    this.state = {
      quotes: {},
      pairs: {},
      favorite_pairs: [],
      current_search: "", 
      current_sort_index: "base", 
      current_sort_dsc: true
    }
  }

  componentDidMount() {
    let i = 1
    this.intervalId = setInterval(() => { 
      this.updateVolume()
    }, 2000);
    // if (common.isUserLogin()) {
    //   limitOrderServices.getFavoritePairs().then(
    //     (res) => {
    //       this.setState({favorite_pairs: res.map(obj => `${obj.base.toUpperCase()}_${obj.quote.toUpperCase()}`)})
    //     }
    //   )
    // }
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  updateVolume = () => {
    limitOrderServices.getVolumeAndChange()
    .then((res) => { 
      this.setState((state, props) => ({pairs: res}))
    })
  }

  onQuoteClick = (quote) => {
    this.props.dispatch(limitOrderActions.updateCurrentQuote(quote))
    this.props.global.analytics.callTrack("trackLimitOrderClickChooseMarket", quote)
  }

  onSearch = (text) => {
    this.setState((state, props) => ({current_search: text}))
  }

  onFavoriteClick = (base, quote, to_fav) => {
    if (common.isUserLogin()) {
      const {favorite_pairs} = this.state
      const index = favorite_pairs.indexOf(base+"_"+quote)
      if (index == -1){
        favorite_pairs.push(base+"_"+quote)
      }else {
        favorite_pairs.splice(index, 1)
      }
      this.setState({favorite_pairs: favorite_pairs})
      limitOrderServices.updateFavoritePairs(base, quote, to_fav)
      this.props.global.analytics.callTrack("trackLimitOrderClickFavoritePair", "Logged in", base + "/" + quote, to_fav)
    }else {
      this.props.dispatch(limitOrderActions.updateFavoriteAnonymous(base, quote, to_fav))
      this.props.global.analytics.callTrack("trackLimitOrderClickFavoritePair", "Anonymous", base + "/" + quote, to_fav)
    }
  }

  onSort = (i, isDsc) => {
    this.setState((state, props)=>({current_sort_index: i, current_sort_dsc: isDsc}))
  }
  
  search(quotes){
    const { current_search, current_sort_index, current_sort_dsc, pairs } = this.state
    const { currentQuote } = this.props
    return (
      currentQuote === "FAV" ?
        Object.keys(quotes).reduce((res, key) => res.concat(quotes[key]),[]).filter((pair) => pair["is_favorite"]) : 
        quotes[currentQuote]
    )
    .filter(pair => (pair["base"].toLowerCase().includes(current_search.toLowerCase())))
    .map(pair => ({
      ...pair, 
      volume: (Object.keys(pairs).includes(pair.id) ? pairs[pair.id].volume : "-" ), 
      change: (Object.keys(pairs).includes(pair.id) ? pairs[pair.id].change : "0" )
    }))
    .sort(function(a,b){return (current_sort_dsc ? 1 : -1)*(a[current_sort_index] > b[current_sort_index] ? -1 : 1)})
  }


  renderQuotes(){
    const { tokens } = this.props
    const fav = this.props.favorite_pairs

    const quotes = Object.keys(tokens).filter((key)=> (tokens[key]["is_quote"] && key !== "ETH"))
    .sort((first, second) => {
      return sortQuotePriority(tokens, first, second);
    });

    const result = quotes.reduce((res, quote) => {
        res[quote] = Object.keys(tokens).filter((key)=> (tokens[key]["sp_limit_order"])).filter(key => {
          // if quote A priority < other quote priorities, remove other quotes from list token of quote A
          const quotePriority = tokens[quote].quote_priority;
          const tokenPriority = tokens[key].quote_priority;

          if (quotePriority && tokenPriority && quotePriority < tokenPriority) {
            // remove from list
            return false;
          }
          return true;
        })
          .reduce((vt, key) =>{
            return key == quote ? vt : vt.concat({   
                id: key+"_"+quote, 
                base: key, quote: quote, 
                price: (+converter.divOfTwoNumber(tokens[key].rate, quote == "ETH" ? '1000000000000000000' : tokens[quote].rate)).toFixed(5), 
                is_favorite: fav.includes(key+"_"+quote),
                volume: "-",
                change: "0"
            });
          }, []); 
        return res
      },{});
    return result;
  }

  renderTh = () => {
    return [
      { html: "Pair", field: "base" }, 
      { html: "Price", field: "price" }, 
      { html: "Volume", field: "volume" }, 
      { html: "Change", field: "change" }
    ].map((i, index) => (
      <div className={`c${index+1}`}>
        <SortableComponent 
          Wrapper={"span"}
          key={i["html"]} 
          text={i["html"]}
          onClick={(is_dsc) => this.onSort(i["field"], is_dsc)}
          isActive={this.state.current_sort_index == i["field"]} />
      </div>
    ))
  }

  onPairClick = (base, quote) => {
    quote = quote == "ETH" ? "WETH" : quote
    this.props.selectSourceAndDestToken(quote, base);
    this.props.global.analytics.callTrack("trackLimitOrderClickSelectPair", base + "/" + quote)
  }
  render(){
    const quotes = this.renderQuotes()
    const { tokens, currentQuote } = this.props
    const list = Object.keys(quotes).length > 0 ? this.search(quotes) : []
    return (
      <div id="quote-market" className="theme__background-2"> 
          { Object.keys(tokens).length > 0 ? 
            <div id="container">
              <div id="panel" className="theme__text-4 theme__border">
                <Search onSearch={this.onSearch}/>
                <QuoteList onClick={this.onQuoteClick} currentQuote={currentQuote} quotes={["FAV"].concat(Object.keys(quotes))}/>
              </div>
              <div className="table">
                <div className="table__header">
                  <div className="table__row">
                    <div className="c0"></div>
                    {this.renderTh()}
                  </div>
                </div>
                <div className="table__body">
                  {list.map(pair => <div key={pair["id"]} className="table__row">
                    <div className="overlay" onClick={() => this.onPairClick(pair["base"], pair["quote"])}></div>
                    <div className={"c0"} onClick={() => this.props.onFavoriteClick(pair["base"], pair["quote"], !pair["is_favorite"])}>
                      <div className={pair["is_favorite"] ? "star active" : "star" } />
                    </div>
                    <div className={"c1"} >{`${pair["base"]}/${pair["quote"] == "WETH" ? "ETH*" : pair["quote"]}`}</div>
                    <div className={"c2"} >{pair["price"]}</div>
                    <div className={"c3"} >{pair["volume"]}</div>
                    <div className={`${pair["change"] > 0 ? "up" : "down"} c4`}>{Math.abs(pair["change"])}%</div>
                  </div>)}
                </div>
              </div>
            </div> : 
            <div className="rate-loading"> <img src={require('../../../../assets/img/waiting-white.svg')} /></div>}
      </div>
    )
  }
}
