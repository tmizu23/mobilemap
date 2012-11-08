//--jsGadget--------------------------------------------------------------------------
// 最新情報   : http://jsgt.org/mt/01/
// Public Domain 著作権表示義務無し。商用利用、改造、自由。連絡不要。

////
// jsgt_Indicator インジケータ オブジェクト 
//
// @author     Toshiro Takahashi 
// @support    http://jsgt.org/mt/archives/01/000906.html
// @download   http://jsgt.org/lib/indicator/
// @version    0.03 jsgt_indicator003.js DOM構築待ちを回避するindi_append
// @license    Public Domain 著作権表示義務無し。商用利用、改造、自由。連絡不要。
// @syntax     oj = new jsgt_Indicator(imagSrc)
// @sample     oj = new jsgt_Indicator('img.gif')
// @method     oj.indi_apend(id)    DOMへ追加 引数はインジケータをappendする要素のID名
// @method     oj.indi_start()    インジケータスタート
// @method     oj.indi_stop()     インジケータスタート
// @property   oj.div             出力するdivオブジェクト
// @property   oj.div.style       スタイルオブジェクト(CSSを利用できます)
// @return     インジケータオブジェクトのインスタンス
//
// @Thanx      Thanx for AJAX Activity indicators http://mentalized.net/activity-indicators/
// 

function jsgt_Indicator(src)
{

  this.div        = setIndicatorDIV(src);

  this.indi_append = indi_append;
  this.indi_start  = indi_start;
  this.indi_stop   = indi_stop;

  this.img = new Image();
  this.img.src = src;

  function setIndicatorDIV(src)
  {
    // インジケータを出力するdiv
    id = "_indicator"+(new Date()).getTime();//idを生成;
    this.div = document.createElement("DIV") ;

    // インジケータ用DIVのデフォルト値(インスタンスで上書き変更できます)
    this.div.style.position = "relative";
    this.div.style.top      = "0px";
    this.div.style.left     = "0px";
    this.div.style.width    = "0px";
    this.div.style.height   = "0px";
    this.div.style.margin  = '0px' ; 
    this.div.style.padding = '0px' ; 
    
    return this.div
  }

  function indi_append(id)
  {
    if(typeof document.getElementById(id) != 'object')return;
    document.getElementById(id).appendChild(this.div);
  }

  //インジケータ スタート
  function indi_start()
  {
    //サイズを与えることで表示する
    this.div.style.height ="12px";
    this.div.style.width ="auto";
    this.div.innerHTML  = '<img src="'+this.img.src+'">' ;
  }

  //インジケータ ストップ
  function indi_stop()
  {
    this.div.style.width ="0px";
    this.div.style.height ="0px";
    this.div.innerHTML  = '' ;
  }
  return this
}
