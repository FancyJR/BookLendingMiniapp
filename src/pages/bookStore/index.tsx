import { ComponentClass } from 'react'
import Taro, { Component, Config } from '@tarojs/taro'
import { AtTabs, AtTabsPane, AtGrid, AtSearchBar } from 'taro-ui'
import { connect } from '@tarojs/redux'
import { autobind } from 'core-decorators'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { updataState, queryBookList } from '../../actions/bookStore'

import './index.less'

// #region 书写注意
//
// 目前 typescript 版本还无法在装饰器模式下将 Props 注入到 Taro.Component 中的 props 属性
// 需要显示声明 connect 的参数类型并通过 interface 的方式指定 Taro.Component 子类的 props
// 这样才能完成类型检查和 IDE 的自动提示
// 使用函数模式则无此限制
// ref: https://github.com/DefinitelyTyped/DefinitelyTyped/issues/20796
//
// #endregion

let ImageLoadList = []

type Book = {
  image: string;
  value: string;
}

type PageStateProps = {
  bookStore: {
    bookList: Book[];
  },
  dispatch: (arg: any) => any
}

type PageDispatchProps = {
  // updataState: () => void
  // queryBookList: () => any
  dispatch: ({ type: string, payload: any }) => PageStateProps
}

type PageOwnProps = {}

type PageState = {
  current: number,
  searchValue: string, // 搜索输入框value
  selector: any,
  imgWidth: number,
  goodsRight: any,
  goodsLeft: any,
}

type IProps = PageStateProps & PageDispatchProps & PageOwnProps

interface Index {
  props: IProps;
  state: PageState;
}

@connect(({ bookStore }) => ({
  bookStore,
}))
@autobind
class Index extends Component {

  /**
 * 指定config的类型声明为: Taro.Config
 *
 * 由于 typescript 对于 object 类型推导只能推出 Key 的基本类型
 * 对于像 navigationBarTextStyle: 'black' 这样的推导出的类型是 string
 * 提示和声明 navigationBarTextStyle: 'black' | 'white' 类型冲突, 需要显示声明类型
 */
  config: Config = {
    navigationBarTitleText: '书库'
  }

  constructor(props) {
    super(props);
    this.state = {
      current: 0,
      searchValue: '', // 搜索输入框value,
      selector: ['美国', '中国', '巴西', '日本'],
      imgWidth: 0,
      goodsLeft: [],
      goodsRight: [],
    }
  }
  componentWillReceiveProps(nextProps) {
    // console.log(this.props, nextProps)
  }

  componentWillMount() {
    Taro.getSystemInfo({
      success: (res => {
        let ww = res.windowWidth;
        let wh = res.windowHeight;
        let imgWidth = ww * 0.5;

        this.setState({
          imgWidth
        })
      })
    })
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(queryBookList({ current: this.state.current }))
  }
  componentWillUnmount() { }

  componentDidShow() {
    const { dispatch } = this.props;
    dispatch(queryBookList({ current: this.state.current }))
  }

  componentDidHide() { }

  handleClick(tabKey) {
    ImageLoadList = []
    const { dispatch } = this.props;
    this.setState({
      current: tabKey,
    })
    dispatch(queryBookList({ current: tabKey }))
  }

  handleSearchChange(value: string) {
    this.setState({ searchValue: value })
  }

  handleSearch() {
    const { dispatch } = this.props;
    dispatch();
  }

  // renderBookList() {
  //   const { bookStore } = this.props
  //   const { bookList } = bookStore
  //   return (
  //     <AtGrid data={bookList} onClick={this.onOpenDetailPage} />
  //   )
  // }

  onChange = e => {
    this.setState({
      selectorChecked: this.state.selector[e.detail.value]
    })
  }

  goToHaveBorrow(v) {
    if (Taro.getStorageSync('phone')) {
      Taro.setStorageSync('nowBookDetail', v)
      Taro.navigateTo({
        url: '/pages/haveBorrow/index'
      })
    } else {
      Taro.navigateTo({
        url: '/pages/login/index'
      })
    }
  }

  onImageLoad = (e) => {
    const { bookStore } = this.props
    const { bookList } = bookStore
    let oImgW = e.detail.width;         //图片原始宽度
    let oImgH = e.detail.height;        //图片原始高度
    let imgWidth = this.state.imgWidth;  //图片设置的宽度
    let scale = imgWidth / oImgW;        //比例计算
    let imgHeight = oImgH * scale;      //自适应高度

    //初始化ImageLoadList数据
    ImageLoadList.push({
      id: parseInt(e.currentTarget.id),
      height: imgHeight,
    })
    //载入全部的图片进入ImageLoadList数组，若数量和bookList中相等，进入图片排序函数
    if (ImageLoadList.length === bookList.length) {
      this.handleImageLoad(ImageLoadList)
    }
  }

  handleImageLoad = (ImageLoadList) => {
    const { bookStore } = this.props
    const { bookList } = bookStore
    //对无序的列表进行排序
    for (let i = 0; i < ImageLoadList.length - 1; i++)
      for (let j = 0; j < ImageLoadList.length - i - 1; j++) {
        if (ImageLoadList[j].id > ImageLoadList[j + 1].id) {
          let temp = ImageLoadList[j]
          ImageLoadList[j] = ImageLoadList[j + 1]
          ImageLoadList[j + 1] = temp
        }
      }
    for (let i = 0; i < bookList.length; i++) {
      ImageLoadList[i].book_img = bookList[i].book_img
      ImageLoadList[i].book_name = bookList[i].book_name
      ImageLoadList[i].book_type = bookList[i].book_type
      ImageLoadList[i].content = bookList[i].content
      ImageLoadList[i].book_isbn = bookList[i].book_isbn
      ImageLoadList[i].id = bookList[i].id
      ImageLoadList[i].imgStyle = { height: ImageLoadList[i].height + 'rpx' }

    }
    //对现在的列表进行操作
    let leftHeight = 0;
    let rightHeight = 0;
    let left = []
    let right = []
    //遍历数组
    for (let i = 0; i < ImageLoadList.length; i++) {
      if (leftHeight <= rightHeight) {
        left.push(ImageLoadList[i])
        leftHeight += ImageLoadList[i].height
      } else {
        right.push(ImageLoadList[i])
        rightHeight += ImageLoadList[i].height
      }
    }
    this.setState({
      goodsRight: right,
      goodsLeft: left
    }, () => {
      console.log(this.state);
    })
  }

  renderBookList() {
    const { goodsRight, goodsLeft, searchValue } = this.state
    const { bookStore } = this.props
    const { bookList } = bookStore
    return (
      <View className="wrap">
        {/* <AtSearchBar
          className="search"
          showActionButton
          value={searchValue}
          placeholder="请输入书名/作者"
          onChange={this.handleSearchChange}
          onActionClick={this.handleSearch}
        /> */}
        <View style={{ display: 'none' }}>
          {
            bookList.map((item, index) => {
              return (
                <Image onLoad={this.onImageLoad} id={index} src={item.book_img}></Image>
              )
            })
          }
        </View>
        <ScrollView>
          {
            <View className="book-left">
              {goodsLeft.map((item, index) => (
                <View className="book-item" onClick={this.goToHaveBorrow.bind(this, item)}>
                  <View>
                    <Image src={item.book_img} className="book-img" style={item.imgStyle} id={index}
                      mode='widthFix' />
                  </View>
                  <View className="book-name">{item.book_name}</View>
                  <View className="book-type" >{item.book_type}</View>
                </View>
              ))}
              <View className="temp" v-for="i in 3"></View>
            </View>
          }
        </ScrollView>
        <ScrollView>
          {
            <View className="book-right">
              {goodsRight.map((item, index) => (
                <View className="book-item" onClick={this.goToHaveBorrow.bind(this, item)}>
                  <View>
                    <Image src={item.book_img} className="book-img" style={item.imgStyle} id={index}
                      mode='widthFix' />
                  </View>
                  <View className="book-name">{item.book_name}</View>
                  <View className="book-type" >{item.book_type}</View>
                </View>
              ))}
              <View className="temp" v-for="i in 3"></View>
            </View>
          }
        </ScrollView>
      </View>)
  }

  renderHaveBookList() {
    const { goodsRight, goodsLeft, searchValue } = this.state
    const { bookStore } = this.props
    const { bookList } = bookStore
    return (
      <View className="wrap">
        {/* <AtSearchBar
          className="search"
          showActionButton
          value={searchValue}
          placeholder="请输入书名/作者"
          onChange={this.handleSearchChange}
          onActionClick={this.handleSearch}
        /> */}
        <View style={{ display: 'none' }}>
          {
            bookList.map((item, index) => {
              return (
                <Image onLoad={this.onImageLoad} id={index} src={item.book_img}></Image>
              )
            })
          }
        </View>
        <ScrollView>
          {
            <View className="book-left">
              {goodsLeft.map((item, index) => (
                <View className="book-item">
                  <View>
                    <Image src={item.book_img} className="book-img" style={item.imgStyle} id={index}
                      mode='widthFix' />
                  </View>
                  <View className="book-name">{item.book_name}</View>
                  <View className="book-type" >{item.book_type}</View>
                </View>
              ))}
              <View className="temp" v-for="i in 3"></View>
            </View>
          }
        </ScrollView>
        <ScrollView>
          {
            <View className="book-right">
              {goodsRight.map((item, index) => (
                <View className="book-item">
                  <View>
                    <Image src={item.book_img} className="book-img" style={item.imgStyle} id={index}
                      mode='widthFix' />
                  </View>
                  <View className="book-name">{item.book_name}</View>
                  <View className="book-type" >{item.book_type}</View>
                </View>
              ))}
              <View className="temp" v-for="i in 3"></View>
            </View>
          }
        </ScrollView>
      </View>)
  }

  renderMostBookList() {
    return (
      <View className="wrap-wait">
        <Text className="todo-content">敬请期待...</Text>
      </View>)
  }

  onOpenDetailPage(item) {
    Taro.navigateTo({
      url: `/pages/bookDetail/index?bookId=${item.id}`
    })
  }
  render() {
    const tabList = [{ title: '可借阅' }, { title: '已借出' }, { title: '借阅最多' }]
    return (
      <AtTabs current={this.state.current} tabList={tabList} onClick={this.handleClick.bind(this)}>
        <AtTabsPane current={this.state.current} index={0} >
          {
            this.renderBookList()
          }
        </AtTabsPane>
        <AtTabsPane current={this.state.current} index={1}>
          {
            this.renderHaveBookList()
          }
        </AtTabsPane>
        <AtTabsPane current={this.state.current} index={2}>
          {
            this.renderMostBookList()
          }
        </AtTabsPane>
      </AtTabs >
    )
  }
}

// #region 导出注意
//
// 经过上面的声明后需要将导出的 Taro.Component 子类修改为子类本身的 props 属性
// 这样在使用这个子类时 Ts 才不会提示缺少 JSX 类型参数错误
//
// #endregion

export default Index as ComponentClass<PageOwnProps, PageState>
