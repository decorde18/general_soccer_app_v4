Attribute VB_Name = "PublicStrings"
Option Compare Database
Option Explicit
Global strpubReportName, strFormGameNo, strHomeLocation, strFormDirection, strFileLocation  As String
Global Re, Gr, Bl, He, RGB1 As String
Global Re2, Gr2, Bl2, He2, RGB2 As String
Global Re3, Gr3, Bl3, He3, RGB3  As String
Global strReportPrintButton
Global strCurrentGK, strPeriodTime, strGame, strSeason, strAdjStopTime, PeriodNoHolder, strPeriodStoppedTime, strGameTime, strGF, strGA, strGameEvent As Integer
Global strGameStatsForm, strReportDirectory As String

Public Function strGameIDpub() As Integer
Let strGameIDpub = strGame
End Function

Public Function strSeasonIDpub() As Integer
Let strSeasonIDpub = strSeason
End Function
Public Function strCurrentGKpub() As Integer
Let strCurrentGKpub = strCurrentGK
End Function
Public Function strPeriodNoHolderpub() As Integer
Let strPeriodNoHolderpub = PeriodNoHolder
End Function
Public Function strPeriodTimepub() As Integer
Let strPeriodTimepub = strPeriodTime
End Function
Public Function strPeriodStoppedTimepub() As Integer
Let strPeriodStoppedTimepub = strPeriodStoppedTime
End Function
Public Function strAdjStopTimepub() As Integer
Let strAdjStopTimepub = strAdjStopTime
End Function
Public Function strGameTimepub() As Integer
Let strGameTimepub = strGameTime
End Function



