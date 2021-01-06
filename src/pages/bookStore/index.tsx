import { ComponentClass } from 'react'
import Taro, { Component, Config } from '@tarojs/taro'
import { AtTabs, AtTabsPane, AtGrid, AtSearchBar } from 'taro-ui'
import { connect } from '@tarojs/redux'
import { autobind } from 'core-decorators'
import { View, Text } from '@tarojs/components'
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
    }
  }
  componentWillReceiveProps(nextProps) {
    // console.log(this.props, nextProps)
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

  renderBookList() {
    const { searchValue } = this.state
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
        <View className="wrap-box">
          {bookList.map((item, index) => (
            <View className="wrap-every" onClick={this.goToHaveBorrow.bind(this, item)}>
              <View>
                <image
                  style="width: 80px; height: 80px; border-radius: 10px;"
                  src="{{item.book_img}}" />
              </View>
              <View className="book-name">{item.book_name}</View>
              <Text className="book-type" >{item.book_type}</Text>
            </View>
          ))}
          <View className="temp" v-for="i in 3"></View>
        </View>
      </View>)
  }

  renderHaveBookList() {
    const { searchValue } = this.state
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
        <View className="wrap-box">
          {bookList.map((item, index) => (
            <View className="wrap-every">
              <View>
                <image
                  style="width: 80px; height: 80px; border-radius: 10px;"
                  src="{{item.book_img}}" />
              </View>
              <View className="book-name">{item.book_name}</View>
              <Text className="book-type" >{item.book_type}</Text>
            </View>
          ))}
          <View className="temp" v-for="i in 3"></View>
        </View>
      </View>)
  }

  renderMostBookList() {
    return (
      <View className="wrap">
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
