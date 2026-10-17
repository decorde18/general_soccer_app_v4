Attribute VB_Name = "Form_NavigationForm"
Attribute VB_Base = "0{3DDE95B6-569C-491B-9FC5-69E6B484B24C}"
Attribute VB_GlobalNameSpace = False
Attribute VB_Creatable = True
Attribute VB_PredeclaredId = True
Attribute VB_Exposed = False
Attribute VB_TemplateDerived = False
Attribute VB_Customizable = False
Option Compare Database
Option Explicit





Private Sub Form_Open(Cancel As Integer)
Dim ctl As Control
Call TeamColors
strReportPrintButton = 1
Me.Section(acDetail).BackColor = RGB1
Me.SeasonLabel.ForeColor = RGB2
Me.Season.ForeColor = RGB2
Me.Season.BackColor = RGB1


'NEED A WAY TO CREATE A NEW SEASON...
'If IsNull(DLookup("[SeasonID]", "seasontable", "[season]=Year(Now())")) Then


If strSeason = 0 Then
    Let Season = DLookup("[SeasonID]", "seasontable", "[season]=Year(Now())")
    strSeason = Season
    Me.Refresh
Else:
    Let Season = strSeason
    Me.Refresh
End If
Call TeamColors

For Each ctl In Me.Nav1.Controls
    With ctl
            .BackColor = RGB1
            .ForeColor = RGB2
            .HoverColor = RGB2
            .HoverForeColor = RGB1
            .PressedColor = RGB3
            .PressedForeColor = RGB2
    End With
Next ctl
For Each ctl In Me.Nav2.Controls
        With ctl
            .BackColor = RGB1
            .ForeColor = RGB2
            .HoverColor = RGB2
            .HoverForeColor = RGB1
            .PressedColor = RGB3
            .PressedForeColor = RGB2
    End With
Next ctl
For Each ctl In Me.Nav3.Controls
        With ctl
            .BackColor = RGB1
            .ForeColor = RGB2
            .HoverColor = RGB2
            .HoverForeColor = RGB1
            .PressedColor = RGB3
            .PressedForeColor = RGB2
    End With
Next ctl
Let strFileLocation = DLookup("filelocation", "databasedefaults")
End Sub




Private Sub GameSTATSButton_Click()
Forms!navigationform.PrintReportButton.Enabled = False

End Sub

Private Sub NavigationButton139_Click()
Forms!navigationform.PrintReportButton.Enabled = True
strpubReportName = "GameSchedule"
End Sub

Private Sub NavigationButton158_Click()
Forms!navigationform.PrintReportButton.Enabled = True

End Sub

Private Sub NavigationButton173_Click()
Forms!navigationform.PrintReportButton.Enabled = True

End Sub

Private Sub NavigationButton177_Click()
Forms!navigationform.PrintReportButton.Enabled = False

End Sub

Private Sub NavigationButton39_Click()
Forms!navigationform.PrintReportButton.Enabled = True

End Sub

Private Sub NavigationButton44_Click()
Forms!navigationform.PrintReportButton.Enabled = False

End Sub

Private Sub NavigationButton499_Click()
Forms!navigationform.PrintReportButton.Enabled = True

End Sub

Private Sub NavigationButton501_Click()
    

'Delete If strReportPrintButton and attach to each of the buttons on Navigation Form
'Also delete from each report on open and close

End Sub

Private Sub NavigationButton503_Click()
Forms!navigationform.PrintReportButton.Enabled = True

End Sub

Private Sub NavigationButton506_Click()
Forms!navigationform.PrintReportButton.Enabled = True
strpubReportName = "GameSchedule"
End Sub

Private Sub NavigationButton508_Click()
Forms!navigationform.PrintReportButton.Enabled = True
strpubReportName = "GameSchedule-AwayGames"
End Sub

Private Sub NavigationButton551_Click()
Forms!navigationform.PrintReportButton.Enabled = True

End Sub

Private Sub NavigationButton553_Click()
Forms!navigationform.PrintReportButton.Enabled = True

End Sub

Private Sub NavigationButton582_Click()
Forms!navigationform.PrintReportButton.Enabled = True
End Sub

Private Sub NavigationButton584_Click()
Forms!navigationform.PrintReportButton.Enabled = True
End Sub

Private Sub NavigationButton586_Click()
Forms!navigationform.PrintReportButton.Enabled = True

End Sub

Private Sub OpenDBDefaults_Click()
DoCmd.Close , ""
DoCmd.OpenForm "databasedefaultsform"

End Sub

Private Sub PrintReportButton_Click()
DoCmd.SelectObject acReport, strpubReportName, True
DoCmd.RunCommand acCmdPrint
End Sub

Private Sub Save_Reports_Click()
On Error GoTo UpdateHTMLs_Err

    DoCmd.SetWarnings False
    DoCmd.OutputTo acOutputReport, "SeasonRosterNumerically", "PDFFormat(*.pdf)", strFileLocation & "Roster.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "GameSchedule", "PDFFormat(*.pdf)", strFileLocation & "GameSchedule.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "GameSchedule-AwayGames", "PDFFormat(*.pdf)", strFileLocation & "GameSchedule-Away Games.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonRosterNumericallyJVOnly", "PDFFormat(*.pdf)", strFileLocation & "RosterJVOnly.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonOverviewReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonOverviewReport.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonRosterNumericallyVarsityOnly", "PDFFormat(*.pdf)", strFileLocation & "RosterVarsityOnly.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "CareerPointsReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerPoints.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "CareerGoalsReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerGoals.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "CareerAssistsReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerAssists.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "CareerPlusReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerPlus.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "CareerPlusMinusReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerPlusMinus.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonPointsReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonPoints.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonGoalsReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonGoals.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonAssistsReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonAssists.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonPlusReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonPlus.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "SeasonPlusMinusReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonPlusMinus.pdf", False, "", , acExportQualityPrint
    'DoCmd.OutputTo acOutputForm, "SeasonStatsForExport", "PDFFormat(*.pdf)",strfilelocation & "STATSFiles\SeasonCurrent.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "CareerStats", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerStats.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "AllPlayersHistory", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\AllPlayersHistory.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputReport, "AllTimeSeasonResults", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\AllTimeSeasonResults.pdf", False, "", , acExportQualityPrint
   DoCmd.OutputTo acOutputReport, "OpponentResultsSubReport", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\AllSeriesRecords.pdf", False, "", , acExportQualityPrint
   DoCmd.OutputTo acOutputReport, "AllPlayersHistory", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\AllPlayersHistory.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "SeasonStatsGKSaves", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonStatsGKSaves.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "SeasonStatsGKGAA", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonStatsGKGAA.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "SeasonStatsGKSavePerc", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonStatsGKSavePerc.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "CareerStatsGKSaves", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerStatsGKSaves.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "CareerStatsGKGAA", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerStatsGKGAA.pdf", False, "", , acExportQualityPrint
    DoCmd.OutputTo acOutputForm, "CareerStatsGKSavePerc", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\CareerStatsGKSavePerc.pdf", False, "", , acExportQualityPrint
Dim criteria As String
criteria = "SeasonID = strSeasonIDpub()"
    DoCmd.OpenForm "SeasonStats", acViewPreview, , criteria, acHidden
    DoCmd.OutputTo acOutputForm, "SeasonStats", "PDFFormat(*.pdf)", strFileLocation & "STATSFiles\SeasonStatsCurrent.pdf", False, "", , acExportQualityPrint
    DoCmd.Close acForm, "SeasonStats", acSaveNo
UpdateHTMLs_Exit:
    Exit Sub

UpdateHTMLs_Err:
    MsgBox Error$
    Resume UpdateHTMLs_Exit
End Sub

Private Sub Season_AfterUpdate()
Let strSeason = Season

Me.Refresh

End Sub



'------------------------------------------------------------
' ExitDB_Click
'
'------------------------------------------------------------
Private Sub ExitDB_Click()

    DoCmd.Quit acPrompt

End Sub


