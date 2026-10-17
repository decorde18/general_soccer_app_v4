Attribute VB_Name = "Form_GameStatsFormVersion3_GameBreak"
Attribute VB_Base = "0{75132F9E-DB54-4FB2-BC93-BAC05C35A1CD}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database


Private Sub AdjustGameDetails_Click()
DoCmd.Close
    DoCmd.OpenForm "GameStatsFormVersion3", acNormal, "", "[gameid]=" & strGame, , acNormal
Forms("gamestatsformversion3").RegPeriods.SetFocus
Forms("gamestatsformversion3").HighSchoolName.Visible = True
Forms("gamestatsformversion3").GamePicker.Visible = False
Forms("gamestatsformversion3").SelectGameLabel.Visible = False
Forms("gamestatsformversion3").ReturnToGame.Visible = True

End Sub

Private Sub Form_Load()
PeriodNoHolder = DCount("Period", "GamesInfoTimes", "GameGameInfoTimesID=" & strGameIDpub()) + 1
strPeriodTime = 0
End Sub


Private Sub Form_Open(Cancel As Integer)
DoCmd.Maximize
Forms!GameStatsFormVersion3_GameBreak!GameStatsFormVersion3_Subs!AllSubs.Visible = False
Forms!GameStatsFormVersion3_GameBreak!GameStatsFormVersion3_Subs!SingleSub.Visible = False
End Sub

Private Sub StartPeriodButton_Click()
Call UpdateSubMinutes
Call UpdatePlayerGameMinutes
Call UpdateStarterMinutes
DoCmd.GoToRecord , , acNewRec
Let GameGameInfoTimesID = strGameIDpub()
Let [Period] = PeriodNoHolder
Let [PeriodStartTime] = Now()
DoCmd.RunCommand acCmdSaveRecord
Forms!GameStatsFormVersion3_GameBreak!GameStatsFormVersion3_Subs!AllSubs.Visible = True
Forms!GameStatsFormVersion3_GameBreak!GameStatsFormVersion3_Subs!SingleSub.Visible = True
DoCmd.Close
DoCmd.OpenForm strGameStatsForm
End Sub
