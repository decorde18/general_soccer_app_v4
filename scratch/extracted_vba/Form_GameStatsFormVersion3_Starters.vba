Attribute VB_Name = "Form_GameStatsFormVersion3_Starters"
Attribute VB_Base = "0{18E7DC7E-EB5A-45A2-98F1-A15CC05873C3}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database

Private Sub CancelButton_Click()
Let GKStart = 0
Let strCurrentGK = 0
DoCmd.Close
End Sub

Private Sub Dressed_Click()
If Dressed = -1 Then
Let Injured = 0
Else: Let Start = 0
End If
Form.Requery
End Sub

Private Sub Form_Load()
DoCmd.Maximize

'DoCmd.MoveSize , , 4.75 * 1440, 7 * 1440
End Sub

Private Sub Form_Open(Cancel As Integer)
Detail.Visible = True

If strCurrentGK > 0 Then
Let GKStart = strCurrentGK
Else
Detail.Visible = False
End If

End Sub

Private Sub GKStart_AfterUpdate()
DoCmd.SetWarnings False
If DCount("Dressed", "Player-GameInfo", "[PlayerIDPlayerGameInfo]=" & strGameIDpub()) < 1 Then
DoCmd.RunSQL "UPDATE (GamesTable INNER JOIN [Player-GameInfo] ON GamesTable.GameID = [Player-GameInfo].GameIDPlayerGameInfo) INNER JOIN PlayerSeasonTable ON ([Player-GameInfo].PlayerIDPlayerGameInfo = PlayerSeasonTable.[Player#]) AND (GamesTable.SeasonIDGames = PlayerSeasonTable.SeasonID) SET [Player-GameInfo].Dressed = -1 WHERE (((PlayerSeasonTable.Varsity)=True) AND ((GamesTable.GameID)=strGameIDpub()))"
End If
If GKStart > 0 Then
    DoCmd.RunSQL "UPDATE [Player-GameInfo] SET [Player-GameInfo].Start = 0 WHERE ((([Player-GameInfo].PlayerIDPlayerGameInfo)=strCurrentGKpub()) AND (([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()))"
  Let strCurrentGK = GKStart
  DoCmd.RunSQL "UPDATE [Player-GameInfo] SET [Player-GameInfo].Start = -1, [Player-GameInfo].Dressed = -1, [Player-GameInfo].Injured = 0 WHERE ((([Player-GameInfo].PlayerIDPlayerGameInfo)=strCurrentGKpub()) AND (([Player-GameInfo].GameIDPlayerGameInfo)=strGameIDpub()))"
  DoCmd.RunSQL "UPDATE GamesTable SET GamesTable.CurrentGK = strCurrentGKpub() WHERE (((GamesTable.GameID)=strGameIDpub()))"
    Detail.Visible = True
  DoCmd.RunCommand acCmdSaveRecord
  Me.Requery
  DoCmd.SetWarnings True
Else
MsgBox "PLEASE SELECT A GOALKEEPER"
End If
End Sub

Private Sub GKStart_BeforeUpdate(Cancel As Integer)

DoCmd.SearchForRecord , "", acLast, "[PlayerID] = " & str(Nz(Screen.ActiveControl, 0))

End Sub



Private Sub Injured_Click()
If Injured = -1 Then
Let Dressed = 0
Let Start = 0
Else: Let Dressed = -1
End If
Me.SumStarters.Requery
 DoCmd.RunCommand acCmdSaveRecord
 Form.Requery
End Sub

Private Sub Start_Click()
If Start = -1 Then
Let Dressed = -1
Let Injured = 0
End If

Me.SumInjured.Requery
 DoCmd.RunCommand acCmdSaveRecord
 Form.Requery
End Sub

Private Sub SubmitButton_Click()
If IsNull(GKStart) = True Then
    MsgBox "Please Select a Goalkeeper to Start Game", vbOKOnly
Exit Sub
End If
If -DSum("Start", "Player-GameInfo", "[GameIDPlayerGameInfo]=" & strGame) < 11 Then

    Dim Response As Integer
    Response = MsgBox("Do you want to start the game with less than 11 players?", vbYesNo)


If Response = vbYes Then
Else
    DoCmd.CancelEvent
    Exit Sub
End If
End If
    If -DSum("Start", "Player-GameInfo", "[GameIDPlayerGameInfo]=" & strGame) > 11 Then
    MsgBox "You have too many starters selected", vbOKOnly
Exit Sub

End If
Form_GameStatsFormVersion3.BeforeGameSub
DoCmd.Close

End Sub
