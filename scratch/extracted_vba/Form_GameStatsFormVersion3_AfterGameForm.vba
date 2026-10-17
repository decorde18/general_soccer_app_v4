Attribute VB_Name = "Form_GameStatsFormVersion3_AfterGameForm"
Attribute VB_Base = "0{349A602E-3DA5-4439-91E8-CF3DA323B5D3}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database



Private Sub Form_Close()
Call UpdateGamePlayerStats
    DoCmd.OpenForm "GameStatsFormVersion3_EndGame", acNormal, "", "[gameid]=" & strGame, , acNormal
End Sub

Private Sub GamePicker_AfterUpdate()
Let strGame = GamePicker
Me.Refresh
Call UpdateGamePlayerStats
End Sub

Private Sub Season_AfterUpdate()
Let strSeason = Season
End Sub
'------------------------------------------------------------
' CloseForm_Click
'
'------------------------------------------------------------
Private Sub CloseForm_Click()

    DoCmd.Close , ""

End Sub


