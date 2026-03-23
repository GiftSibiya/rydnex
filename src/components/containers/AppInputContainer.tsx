import { Keyboard, StyleSheet, TouchableWithoutFeedback, View } from 'react-native'
import React from 'react'

interface InputContainerProps{
  children: React.ReactNode
}

const AppInputContainer: React.FC<InputContainerProps> = ({ children}) => {
  return (
    <View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} >
        {children}
      </TouchableWithoutFeedback>
    </View>
  )
}

export default AppInputContainer

const styles = StyleSheet.create({})