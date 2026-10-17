Attribute VB_Name = "Form_GameStatsFormVersion3_EndGame"
Attribute VB_Base = "0{3EDE66D0-ECB7-46BB-9A91-8F29D7B59B5A}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub AdjustStoppages_Click()
DoCmd.Close
    DoCmd.OpenForm "GameStatsFormVersion3_AfterGameForm", acNormal, "", "[gameid]=" & strGame, , acNormal

End Sub

Private Sub ExitGameButton_Click()
DoCmd.Close
DoCmd.OpenForm "NavigationForm"
End Sub

Private Sub Form_Load()
Call UpdateGamePlayerStats
DoCmd.Maximize
End Sub
'------------------------------------------------------------
' AdjustGameDetails_Click
'
'------------------------------------------------------------
Private Sub AdjustGameDetails_Click()
DoCmd.Close
    DoCmd.OpenForm "GameStatsFormVersion3", acNormal, "", "[gameid]=" & strGame, , acNormal
Forms("gamestatsformversion3").RegPeriods.SetFocus
Forms("gamestatsformversion3").HighSchoolName.Visible = True
Forms("gamestatsformversion3").GamePicker.Visible = False
Forms("gamestatsformversion3").SelectGameLabel.Visible = False
Forms("gamestatsformversion3").ReturnToGame.Visible = True

End Sub

