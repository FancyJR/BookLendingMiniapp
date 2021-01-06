import { ComponentClass } from 'react'
import Taro, { Component, Config } from '@tarojs/taro'
import { View } from '@tarojs/components'
import { AtForm, AtInput, AtButton, AtMessage } from 'taro-ui'
import { connect } from '@tarojs/redux'
import { autobind } from 'core-decorators'
import { updataState, queryBorrowList } from '../../actions/borrow'
import request from '../../utils/request';

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
  bookId: string
  bookName: string
  shouldReturnDate: string
  borrowDate: string
}

type PageStateProps = {
  borrow: {
    borrowList: Array<Book>;
  },
  dispatch: (arg: any) => any
}

type PageDispatchProps = {

}

type PageOwnProps = {}

type PageState = {
  current: number,
  phone: any,
  password: any,
  allHaveV: boolean,
  nowBookDetail: any,
}

type IProps = PageStateProps & PageDispatchProps & PageOwnProps

interface Index {
  props: IProps;
  state: PageState;
}

@connect(({ borrow }) => ({
  borrow,
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
    navigationBarTitleText: '图书详情'
  }

  constructor(props) {
    super(props);
    this.state = {
      current: 0,
      phone: '',
      password: '',
      allHaveV: true,
      nowBookDetail: {}
    }
  }

  componentDidMount() {
    const { dispatch } = this.props;
    dispatch(queryBorrowList({}))
    this.setState({
      nowBookDetail: Taro.getStorageSync('nowBookDetail'),
    })
  }
  componentWillUnmount() { }

  componentDidShow() { }

  componentDidHide() { }

  handleClick(tabKey) {
    const { dispatch } = this.props;
    this.setState({
      current: tabKey,
    })
    // dispatch(queryBookList({}))
  }

  handleSingle(index) {

  }

  handlePhoneChange(value) {
    this.setState({
      phone: value,
    })
    if (this.state.phone && this.state.password) {
      this.setState({
        allHaveV: false,
      })
    }
  }

  handlePasswordChange(value) {
    this.setState({
      password: value,
    })
    if (this.state.phone && this.state.password) {
      this.setState({
        allHaveV: false,
      })
    }
  }

  onSubmit() {
    const { phone, password, nowBookDetail } = this.state;
    request('https://shiyunidt.cn/ogin', { phone, password }).then((res: any) => {
      const { data, statusCode } = res
      if (statusCode === 200 && Array.isArray(data) || data === 1) {
        Taro.setStorageSync('phone', phone)
        Taro.atMessage({
          'message': '登录成功',
          'type': 'success',
        })
        Taro.getUserInfo({
          success: function (res) {
            const userInfo = JSON.parse(res.rawData)
            Taro.setStorageSync('userInfo', userInfo)
          }
        })
        setTimeout(() => {
          Taro.navigateBack({
            delta: 1
          });
        }, 1500);
      } else {
        Taro.atMessage({
          'message': data,
          'type': 'warning',
        })
      }
    })
  }

  borrowBtn() {
    request('https://shiyunidt.cn/getScanBookInfo', { book_isbn: Taro.getStorageSync('nowBookDetail').book_isbn, phone: Taro.getStorageSync('phone') }).then((res: any) => {
      const { data, statusCode } = res
      if (statusCode === 200 && Array.isArray(data) || data === 1) {
        this.setState({ bookDetail: data })
        Taro.atMessage({
          'message': '借书成功',
          'type': 'success',
        })
        setTimeout(() => {
          Taro.navigateBack({
            delta: 1
          });
        }, 1500);
      } else {
        Taro.atMessage({
          'message': data,
          'type': 'warning',
        })
      }
    })
  }

  render() {
    return (
      <View>
        <AtMessage />
        <View className="login-wrap">
          <View className="wrap-every">
            <View className="every-img">
              <image
                style="width: 300px; height: 300px; border-radius: 10px;"
                src="{{nowBookDetail.book_img}}" />
            </View>
            <View className="book-name">{nowBookDetail.book_name}</View>
            <View className="content-box">
              <View class="content-box-title">内容简介</View>
              <View>{nowBookDetail.content}</View>
            </View>
          </View>
        </View >
        <AtButton className="btn" type='primary' size='normal' onClick={this.borrowBtn}>借阅</AtButton>
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
