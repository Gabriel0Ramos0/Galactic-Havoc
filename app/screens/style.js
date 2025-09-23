import { StyleSheet } from "react-native";

export default StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "black",
    },
    joystickOuter: {
        position: "absolute",
        bottom: 60,
        left: 50,
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: "rgba(200,200,200,0.3)",
        justifyContent: "center",
        alignItems: "center",
    },
    joystickInner: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: "rgba(255,255,255,0.7)",
    },
    upButton: {
        position: "absolute",
        right: 50,
        bottom: 130,
        width: 50,
        height: 50,
        backgroundColor: "rgba(255,255,255,0.3)",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 25,
    },
    downButton: {
        position: "absolute",
        right: 50,
        bottom: 60,
        width: 50,
        height: 50,
        backgroundColor: "rgba(255,255,255,0.3)",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 25,
    },
});