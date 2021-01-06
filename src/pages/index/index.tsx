import { ComponentClass } from 'react'
import Taro, { Component, Config } from '@tarojs/taro'
import { View, Image } from '@tarojs/components'
import { AtTabBar, AtSearchBar, AtButton, AtMessage } from 'taro-ui'
import { connect } from '@tarojs/redux'
import { autobind } from 'core-decorators'
import request from '../../utils/request';
import { queryBookList } from '../../actions/bookStore'

import Personal from '../personal'
import BookStore from '../bookStore'

import { add, minus, asyncAdd } from '../../actions/counter'

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


type PageStateProps = {
  counter: {
    num: number
  },
  dispatch: (arg: any) => any
}

type PageDispatchProps = {
  add: () => void
  dec: () => void
  asyncAdd: () => any
  dispatch: ({ type: string, payload: any }) => PageStateProps
}

type PageOwnProps = {}

type PageState = {
  current: number;
  searchValue: string, // 搜索输入框value
  bookDetail: any, // 图书详情
}

type IProps = PageStateProps & PageDispatchProps & PageOwnProps

interface Index {
  props: IProps;
  state: PageState;
}

const navigationBarTitles = {
  0: '书库',
  1: '借阅',
  2: '个人信息'
}

@connect(({ counter }) => ({
  counter
}), (dispatch) => ({
  add() {
    dispatch(add())
  },
  dec() {
    dispatch(minus())
  },
  asyncAdd() {
    dispatch(asyncAdd())
  }
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
    navigationBarTitleText: navigationBarTitles[this.state.current] || '首页'
  }
  constructor(props: IProps) {
    super(props);
    this.state = {
      current: 0,
      searchValue: '', // 搜索输入框value
      bookDetail: {}, // 图书详情
    }
  }
  componentWillReceiveProps(nextProps) {
    console.log(this.props, nextProps)
  }
  shouldComponentUpdate(nextProps: IProps, nextState: PageState) {
    if (JSON.stringify(this.props) !== JSON.stringify(nextProps) || JSON.stringify(this.state) !== JSON.stringify(nextState)) {
      return true
    }
    return false
  }
  componentWillUnmount() { }

  componentDidShow() { }

  componentDidHide() { }

  handleClick(value) {
    this.setState({ current: value })
  }
  handleSearchChange(value: string) {
    this.setState({ searchValue: value })
  }
  handleScanCode() {
    if (!Taro.getStorageSync('phone')) {
      Taro.navigateTo({
        url: '/pages/login/index'
      })
    } else {
      Taro.scanCode().then((param: any) => {
        request('https://shiyunidt.cn/getScanBookInfo', { book_isbn: param.result, phone: Taro.getStorageSync('phone') }).then((res: any) => {
          const { data, statusCode } = res
          if (statusCode === 200 && Array.isArray(data) || data === 1) {
            this.setState({ bookDetail: data })
            Taro.atMessage({
              'message': '借书成功',
              'type': 'success',
            })
          } else {
            Taro.atMessage({
              'message': data,
              'type': 'warning',
            })
          }
        })
      })
    }
  }
  handleSearch() {
    const { dispatch } = this.props;
    dispatch();
  }
  renderIndex() {
    const { searchValue, bookDetail } = this.state
    return (
      <View className="index-wrap">
        {/* <AtSearchBar
          className="search"
          showActionButton
          value={searchValue}
          placeholder="请输入书名/作者"
          onChange={this.handleSearchChange}
          onActionClick={this.handleSearch}
        /> */}
        <View className="scan-icon" />
        <AtButton className='scanCode-btn' circle={true} onClick={this.handleScanCode}>扫码借书</AtButton>
        {bookDetail.length && <View className='at-article'>
          <View className="wrap-every">
            <View>
              <image
                style="width: 180px; height: 180px; border-radius: 10px;"
                src="{{bookDetail[0].book_img}}" />
            </View>
            <View className="book-name">{bookDetail[0].book_name}</View>
            <Text className="book-type" >{bookDetail[0].book_type}</Text>
          </View>
        </View>}
      </View>)
  }

  renderView() {
    const { current } = this.state;
    const { dispatch } = this.props;
    dispatch(queryBookList({ current: 0 }));
    let view: any = null;
    switch (current) {
      case 0: {
        view = <BookStore />;
        break;
      }
      case 1: {
        view = this.renderIndex();
        break;
      }
      case 2: {
        view = <Personal />;
        break;
      }
    }

    return view;
  }
  render() {
    console.log('render')
    return (
      <View className='index'>
        <AtMessage />
        <View className="view-container">
          {
            this.renderView()
          }
        </View>
        <AtTabBar
          fixed
          tabList={[
            { title: '书库', iconType: 'list' },
            { title: '借阅', iconType: 'bookmark' },
            { title: '我的', iconType: 'user' }
          ]}
          onClick={this.handleClick}
          current={this.state.current}
        />
      </View>
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
